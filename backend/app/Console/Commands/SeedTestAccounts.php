<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Provider;
use App\Models\Petition;
use App\Models\Appointment;
use App\Models\Transaction;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Exception\Auth\UserNotFound;

class SeedTestAccounts extends Command
{
    protected $signature = 'lexium:seed-test-accounts {--no-firebase : Skip Firebase account creation (MongoDB only)}';
    protected $description = 'Backfills General Consultation services and creates loginable Sara (citizen) and Aditya (provider) accounts with rich seed data.';

    public function handle(): int
    {
        $this->info('▶ Backfilling General Consultation service into existing providers...');
        $this->backfillGeneralConsultation();

        $skipFirebase = $this->option('no-firebase');
        $firebaseAuth = null;
        if (!$skipFirebase) {
            $firebaseAuth = $this->bootFirebase();
            if (!$firebaseAuth) {
                $this->warn('  Firebase init failed — falling back to MongoDB-only seeding. Run with --no-firebase to skip this check next time.');
            }
        }

        $this->info('▶ Creating test citizen account (Sara)...');
        $sara = $this->ensureCitizenAccount($firebaseAuth, [
            'name'     => 'Sara',
            'email'    => 'sara@gmail.com',
            'password' => 'sara123',
            'phone'    => '+91 98765 11111',
        ]);

        $this->info('▶ Creating test provider account (Aditya)...');
        [$adityaUser, $adityaProvider] = $this->ensureProviderAccount($firebaseAuth, [
            'name'             => 'Aditya',
            'email'            => 'aditya@gmail.com',
            'password'         => 'aditya123',
            'phone'            => '+91 98765 22222',
            'service_type'     => 'Advocate',
            'specialization'   => 'Corporate & Family Law',
            'bar_council_id'   => 'DL/9999/2018',
            'location'         => 'New Delhi',
            'experience'       => '7',
            'bio'              => 'Practicing advocate with 7 years of experience in corporate compliance, contract litigation, and family law matters. Known for thorough preparation and quick turnaround on documentation.',
            'price_range'      => '1500 - 8000',
            'consultation_fee' => 1500,
            'languages'        => ['English', 'Hindi'],
            'qualifications'   => [
                'B.A. LL.B (Hons) — Lovely Professional University',
                'Enrolled with Bar Council of Delhi (2018)',
                'Certified Mediator (2022)',
            ],
            'services' => [
                ['name' => 'General Consultation',  'price' => '1500', 'duration' => '30 min'],
                ['name' => 'Contract Drafting',     'price' => '4000', 'duration' => 'Per document'],
                ['name' => 'Divorce Petition',      'price' => '8000', 'duration' => 'Per case'],
                ['name' => 'Will Drafting',         'price' => '2500', 'duration' => '1-2 days'],
            ],
        ]);

        $this->info('▶ Seeding rich activity between Sara ↔ Aditya...');
        $this->seedRichActivity($sara, $adityaProvider);

        $this->info('');
        $this->info('✅ Done.');
        $this->table(
            ['Account', 'Email', 'Password', 'Role'],
            [
                ['Sara',   'sara@gmail.com',   'sara123',   'citizen'],
                ['Aditya', 'aditya@gmail.com', 'aditya123', 'provider (approved)'],
            ]
        );

        return self::SUCCESS;
    }

    // ── Step 1: Backfill General Consultation ─────────────────────

    private function backfillGeneralConsultation(): void
    {
        $touched = 0;
        Provider::all()->each(function ($provider) use (&$touched) {
            $services = is_array($provider->services) ? $provider->services : [];

            $hasGeneral = collect($services)->contains(function ($s) {
                $name = strtolower($s['name'] ?? '');
                return str_contains($name, 'general consult');
            });
            if ($hasGeneral) return;

            $price = $this->deriveGeneralConsultationPrice($provider, $services);
            $services[] = [
                'name'     => 'General Consultation',
                'price'    => (string) $price,
                'duration' => '30 min',
            ];
            $provider->update(['services' => $services]);
            $touched++;
        });
        $this->line("  $touched provider(s) updated with General Consultation service.");
    }

    private function deriveGeneralConsultationPrice($provider, array $services): int
    {
        // Prefer the lowest priced existing service
        $prices = collect($services)
            ->map(fn ($s) => (int) preg_replace('/[^\d]/', '', (string) ($s['price'] ?? '')))
            ->filter(fn ($n) => $n > 0)
            ->values();
        if ($prices->isNotEmpty()) {
            return $prices->min();
        }

        // Fall back to lower bound of price_range
        if ($provider->price_range) {
            $matches = [];
            if (preg_match_all('/\d[\d,]*/', $provider->price_range, $matches)) {
                $nums = collect($matches[0])->map(fn ($n) => (int) str_replace(',', '', $n))->filter();
                if ($nums->isNotEmpty()) return $nums->min();
            }
        }

        // Final fall back: consultation_fee or a safe default
        return (int) ($provider->consultation_fee ?: 1000);
    }

    // ── Firebase ──────────────────────────────────────────────────

    private function bootFirebase()
    {
        try {
            $credentialsPath = base_path(env('FIREBASE_CREDENTIALS', 'firebase_credentials.json'));
            if (!file_exists($credentialsPath)) {
                $this->warn("  Firebase credentials not found at $credentialsPath.");
                return null;
            }
            return (new Factory)->withServiceAccount($credentialsPath)->createAuth();
        } catch (\Throwable $e) {
            $this->warn('  Firebase init error: ' . $e->getMessage());
            return null;
        }
    }

    private function ensureFirebaseUser($auth, string $email, string $password, string $displayName): ?string
    {
        if (!$auth) return null;
        try {
            try {
                $fbUser = $auth->getUserByEmail($email);
                // Update password to match the documented one — keeps the command idempotent.
                $auth->updateUser($fbUser->uid, [
                    'password'    => $password,
                    'displayName' => $displayName,
                ]);
                $this->line("  Firebase user exists for $email — password reset to known value.");
                return $fbUser->uid;
            } catch (UserNotFound $e) {
                $fbUser = $auth->createUser([
                    'email'         => $email,
                    'emailVerified' => true,
                    'password'      => $password,
                    'displayName'   => $displayName,
                ]);
                $this->line("  Firebase user created for $email.");
                return $fbUser->uid;
            }
        } catch (\Throwable $e) {
            $this->warn("  Firebase create/update failed for $email: " . $e->getMessage());
            return null;
        }
    }

    // ── Account creation ─────────────────────────────────────────

    private function ensureCitizenAccount($firebaseAuth, array $data): User
    {
        $uid = $this->ensureFirebaseUser($firebaseAuth, $data['email'], $data['password'], $data['name']);
        // If Firebase failed, synthesize a stable uid so the MongoDB record still works.
        $uid = $uid ?: 'seed-citizen-' . substr(md5($data['email']), 0, 16);

        $user = User::updateOrCreate(
            ['email' => $data['email']],
            [
                'firebase_uid' => $uid,
                'name'         => $data['name'],
                'role'         => 'citizen',
                'phone'        => $data['phone'] ?? '',
                'status'       => 'active',
            ]
        );
        $this->line("  Citizen MongoDB record ready: {$user->name} ({$user->email})");
        return $user;
    }

    private function ensureProviderAccount($firebaseAuth, array $data): array
    {
        $uid = $this->ensureFirebaseUser($firebaseAuth, $data['email'], $data['password'], $data['name']);
        $uid = $uid ?: 'seed-provider-' . substr(md5($data['email']), 0, 16);

        $user = User::updateOrCreate(
            ['email' => $data['email']],
            [
                'firebase_uid' => $uid,
                'name'         => $data['name'],
                'role'         => 'provider',
                'phone'        => $data['phone'] ?? '',
                'status'       => 'approved',
            ]
        );

        $provider = Provider::updateOrCreate(
            ['user_id' => (string) $user->_id],
            [
                'name'             => $data['name'],
                'email'            => $data['email'],
                'phone'            => $data['phone'] ?? '',
                'service_type'     => $data['service_type'],
                'specialization'   => $data['specialization'],
                'bar_council_id'   => $data['bar_council_id'],
                'location'         => $data['location'],
                'experience'       => $data['experience'],
                'bio'              => $data['bio'],
                'price_range'      => $data['price_range'],
                'consultation_fee' => $data['consultation_fee'],
                'languages'        => $data['languages'],
                'qualifications'   => $data['qualifications'],
                'services'         => $data['services'],
                'rating'           => 4.6,
                'review_count'     => 3,
                'rating_count'     => 3,
                'is_verified'      => true,
                'status'           => 'approved',
                'badges'           => ['verified'],
                'reviews'          => [
                    ['id' => 'rev-1', 'author' => 'Anonymous Client', 'rating' => 5, 'date' => now()->subDays(40)->toDateString(), 'text' => 'Very responsive and methodical.'],
                    ['id' => 'rev-2', 'author' => 'Anonymous Client', 'rating' => 4, 'date' => now()->subDays(15)->toDateString(), 'text' => 'Solid drafting work, slight delay but worth it.'],
                    ['id' => 'rev-3', 'author' => 'Anonymous Client', 'rating' => 5, 'date' => now()->subDays(5)->toDateString(),  'text' => 'Made a complex matter feel manageable.'],
                ],
            ]
        );

        $this->line("  Provider MongoDB record ready: {$provider->name}");
        return [$user, $provider];
    }

    // ── Rich activity seed ───────────────────────────────────────

    private function seedRichActivity(User $sara, Provider $aditya): void
    {
        // Clear any prior seeded data between this pair so re-runs are clean.
        Petition::where('citizen_id', (string) $sara->_id)
            ->where('provider_id', (string) $aditya->_id)->delete();
        Appointment::where('citizen_id', (string) $sara->_id)
            ->where('provider_id', (string) $aditya->_id)->delete();
        Transaction::where('provider_id', (string) $aditya->_id)
            ->where('client_name', $sara->name)->delete();

        $pid = (string) $aditya->_id;
        $cid = (string) $sara->_id;

        // 1) A fresh pending case (citizen filed, provider has not accepted yet)
        Petition::create([
            'petition_id'    => 'PET-2001',
            'citizen_id'     => $cid,
            'citizen_name'   => $sara->name,
            'provider_id'    => $pid,
            'provider_name'  => $aditya->name,
            'type'           => 'General Consultation',
            'details'        => 'Need initial advice on terminating an employment contract with a notice-period clause.',
            'urgency'        => 'normal',
            'quoted_price'   => 1500,
            'status'         => 'pending',
            'next_step'      => 'Provider is reviewing your case.',
            'timeline'       => [[
                'action'    => 'submitted',
                'note'      => 'Case filed and awaiting provider review.',
                'timestamp' => now()->subHours(4)->toISOString(),
            ]],
        ]);

        // 2) An accepted case with upcoming consultation
        $p2 = Petition::create([
            'petition_id'    => 'PET-2002',
            'citizen_id'     => $cid,
            'citizen_name'   => $sara->name,
            'provider_id'    => $pid,
            'provider_name'  => $aditya->name,
            'type'           => 'Contract Drafting',
            'details'        => 'Draft a mutually-binding NDA between two startup founders before co-development.',
            'urgency'        => 'high',
            'quoted_price'   => 4000,
            'status'         => 'under-review',
            'next_step'      => 'Provider has accepted your case. Consultation scheduled.',
            'timeline'       => [
                ['action' => 'submitted', 'note' => 'Case filed.',         'timestamp' => now()->subDays(2)->toISOString()],
                ['action' => 'accepted',  'note' => 'Provider accepted.',  'timestamp' => now()->subDays(1)->toISOString()],
            ],
        ]);
        Appointment::create([
            'citizen_id'    => $cid,
            'citizen_name'  => $sara->name,
            'provider_id'   => $pid,
            'provider_name' => $aditya->name,
            'petition_id'   => (string) $p2->_id,
            'petition_code' => $p2->petition_id,
            'type'          => 'Contract Drafting',
            'date'          => now()->addDays(2)->toDateString(),
            'time'          => '11:30 AM',
            'status'        => 'confirmed',
            'notes'         => 'Consultation linked to case ' . $p2->petition_id,
            'reviewed'      => false,
        ]);

        // 3) An in-progress case where the consultation has already happened (completed appt + cleared txn)
        $p3 = Petition::create([
            'petition_id'    => 'PET-2003',
            'citizen_id'     => $cid,
            'citizen_name'   => $sara->name,
            'provider_id'    => $pid,
            'provider_name'  => $aditya->name,
            'type'           => 'Will Drafting',
            'details'        => 'Draft a will distributing two flats and a small portfolio of mutual funds among three beneficiaries.',
            'urgency'        => 'normal',
            'quoted_price'   => 2500,
            'status'         => 'in-progress',
            'next_step'      => 'Provider is actively working on your case following the consultation.',
            'provider_notes' => 'First draft will be ready by next week. Please send the latest portfolio statement.',
            'timeline'       => [
                ['action' => 'submitted',                'note' => 'Case filed.',                                  'timestamp' => now()->subDays(10)->toISOString()],
                ['action' => 'accepted',                 'note' => 'Provider accepted.',                           'timestamp' => now()->subDays(9)->toISOString()],
                ['action' => 'consultation-completed',   'note' => 'Consultation completed. Case continues.',      'timestamp' => now()->subDays(6)->toISOString()],
                ['action' => 'in-progress',              'note' => 'Drafting first version of will.',              'timestamp' => now()->subDays(2)->toISOString()],
            ],
        ]);
        Appointment::create([
            'citizen_id'    => $cid,
            'citizen_name'  => $sara->name,
            'provider_id'   => $pid,
            'provider_name' => $aditya->name,
            'petition_id'   => (string) $p3->_id,
            'petition_code' => $p3->petition_id,
            'type'          => 'Will Drafting',
            'date'          => now()->subDays(6)->toDateString(),
            'time'          => '02:00 PM',
            'status'        => 'completed',
            'notes'         => 'Consultation linked to case ' . $p3->petition_id,
            'reviewed'      => false, // gives Sara something to review
        ]);
        Transaction::create([
            'transaction_id' => 'TRX-2003',
            'provider_id'    => $pid,
            'client_name'    => $sara->name,
            'type'           => 'Will Drafting',
            'amount'         => 2500,
            'status'         => 'cleared',
            'date'           => now()->subDays(6)->toDateString(),
        ]);

        // 4) A fully resolved case (closed, reviewed)
        $p4 = Petition::create([
            'petition_id'    => 'PET-2004',
            'citizen_id'     => $cid,
            'citizen_name'   => $sara->name,
            'provider_id'    => $pid,
            'provider_name'  => $aditya->name,
            'type'           => 'General Consultation',
            'details'        => 'Quick advice on landlord raising rent mid-lease.',
            'urgency'        => 'normal',
            'quoted_price'   => 1500,
            'status'         => 'closed',
            'next_step'      => 'This case is now closed.',
            'timeline'       => [
                ['action' => 'submitted',              'note' => 'Case filed.',                              'timestamp' => now()->subDays(30)->toISOString()],
                ['action' => 'accepted',               'note' => 'Provider accepted.',                       'timestamp' => now()->subDays(29)->toISOString()],
                ['action' => 'consultation-completed', 'note' => 'Consultation completed.',                  'timestamp' => now()->subDays(27)->toISOString()],
                ['action' => 'resolved',               'note' => 'Resolved — landlord cannot raise rent.',   'timestamp' => now()->subDays(20)->toISOString()],
                ['action' => 'closed',                 'note' => 'Case closed.',                             'timestamp' => now()->subDays(19)->toISOString()],
            ],
        ]);
        Appointment::create([
            'citizen_id'    => $cid,
            'citizen_name'  => $sara->name,
            'provider_id'   => $pid,
            'provider_name' => $aditya->name,
            'petition_id'   => (string) $p4->_id,
            'petition_code' => $p4->petition_id,
            'type'          => 'General Consultation',
            'date'          => now()->subDays(27)->toDateString(),
            'time'          => '10:00 AM',
            'status'        => 'completed',
            'notes'         => 'Consultation linked to case ' . $p4->petition_id,
            'reviewed'      => true, // already reviewed
        ]);
        Transaction::create([
            'transaction_id' => 'TRX-2004',
            'provider_id'    => $pid,
            'client_name'    => $sara->name,
            'type'           => 'General Consultation',
            'amount'         => 1500,
            'status'         => 'cleared',
            'date'           => now()->subDays(27)->toDateString(),
        ]);

        $this->line('  Seeded 4 petitions, 3 appointments, 2 transactions between Sara and Aditya.');
    }
}
