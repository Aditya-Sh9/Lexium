<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Provider;
use App\Models\Appointment;
use App\Models\Petition;
use App\Models\Transaction;

class MongoSeeder extends Seeder
{
    /**
     * Seed the MongoDB collections with sample Lexium data.
     */
    public function run(): void
    {
        // ── Clear existing data ──────────────────────────────────────
        User::truncate();
        Provider::truncate();
        Appointment::truncate();
        Petition::truncate();
        Transaction::truncate();

        $this->command->info('Collections cleared.');

        // ── Create citizen users ─────────────────────────────────────
        $citizen1 = User::create([
            'firebase_uid' => 'mock-uid-123',  // matches MOCK_AUTH uid
            'name'  => 'Rajesh Verma',
            'email' => 'rajesh@example.com',
            'role'  => 'citizen',
        ]);

        $citizen2 = User::create([
            'firebase_uid' => 'citizen-uid-456',
            'name'  => 'Priya Singh',
            'email' => 'priya@example.com',
            'role'  => 'citizen',
        ]);

        // ── Create provider users + profiles ─────────────────────────
        $providerUser1 = User::create([
            'firebase_uid' => 'provider-uid-101',
            'name'  => 'Adv. Ananya Gupta',
            'email' => 'ananya@example.com',
            'role'  => 'provider',
        ]);

        $provider1 = Provider::create([
            'user_id'        => (string) $providerUser1->_id,
            'name'           => 'Adv. Ananya Gupta',
            'email'          => 'ananya@example.com',
            'service_type'   => 'advocate',
            'specialization' => 'Family Law',
            'bar_council_id' => 'MH-2015-1234',
            'location'       => 'Mumbai',
            'experience'     => '10',
            'bio'            => 'Specialist in family law with expertise in divorce proceedings, child custody, and domestic violence cases.',
            'price_range'    => '₹5,000 – ₹15,000',
            'rating'         => 4.9,
            'rating_count'   => 47,
            'is_verified'    => true,
        ]);

        $providerUser2 = User::create([
            'firebase_uid' => 'provider-uid-102',
            'name'  => 'Mediator R. Desai',
            'email' => 'desai@example.com',
            'role'  => 'provider',
        ]);

        $provider2 = Provider::create([
            'user_id'        => (string) $providerUser2->_id,
            'name'           => 'Mediator R. Desai',
            'email'          => 'desai@example.com',
            'service_type'   => 'mediator',
            'specialization' => 'Dispute Resolution',
            'bar_council_id' => '',
            'location'       => 'Delhi',
            'experience'     => '8',
            'bio'            => 'Certified mediator specializing in commercial and family dispute resolution.',
            'price_range'    => '₹3,000 – ₹10,000',
            'rating'         => 4.7,
            'rating_count'   => 32,
            'is_verified'    => true,
        ]);

        $providerUser3 = User::create([
            'firebase_uid' => 'provider-uid-103',
            'name'  => 'Adv. R.K. Singh',
            'email' => 'rksingh@example.com',
            'role'  => 'provider',
        ]);

        $provider3 = Provider::create([
            'user_id'        => (string) $providerUser3->_id,
            'name'           => 'Adv. R.K. Singh',
            'email'          => 'rksingh@example.com',
            'service_type'   => 'advocate',
            'specialization' => 'Property Law',
            'bar_council_id' => 'DL-2010-5678',
            'location'       => 'New Delhi',
            'experience'     => '15',
            'bio'            => 'Senior advocate with extensive experience in property disputes, land acquisition, and real estate transactions.',
            'price_range'    => '₹10,000 – ₹25,000',
            'rating'         => 4.8,
            'rating_count'   => 63,
            'is_verified'    => true,
        ]);

        $this->command->info('Users and providers created.');

        // ── Create appointments ──────────────────────────────────────
        Appointment::create([
            'citizen_id'    => (string) $citizen1->_id,
            'citizen_name'  => $citizen1->name,
            'provider_id'   => (string) $provider1->_id,
            'provider_name' => $provider1->name,
            'type'          => 'Initial Consultation',
            'date'          => now()->addDays(2)->toDateString(),
            'time'          => '10:00 AM',
            'status'        => 'confirmed',
        ]);

        Appointment::create([
            'citizen_id'    => (string) $citizen1->_id,
            'citizen_name'  => $citizen1->name,
            'provider_id'   => (string) $provider2->_id,
            'provider_name' => $provider2->name,
            'type'          => 'Document Verification',
            'date'          => now()->addDays(5)->toDateString(),
            'time'          => '2:30 PM',
            'status'        => 'pending',
        ]);

        Appointment::create([
            'citizen_id'    => (string) $citizen1->_id,
            'citizen_name'  => $citizen1->name,
            'provider_id'   => (string) $provider3->_id,
            'provider_name' => $provider3->name,
            'type'          => 'Property Dispute',
            'date'          => now()->subDays(30)->toDateString(),
            'time'          => '11:00 AM',
            'status'        => 'completed',
        ]);

        Appointment::create([
            'citizen_id'    => (string) $citizen2->_id,
            'citizen_name'  => $citizen2->name,
            'provider_id'   => (string) $provider1->_id,
            'provider_name' => $provider1->name,
            'type'          => 'Contract Review',
            'date'          => now()->addDays(1)->toDateString(),
            'time'          => '1:00 PM',
            'status'        => 'confirmed',
        ]);

        $this->command->info('Appointments created.');

        // ── Create petitions ─────────────────────────────────────────
        Petition::create([
            'petition_id'   => 'PET-1029',
            'citizen_id'    => (string) $citizen1->_id,
            'citizen_name'  => $citizen1->name,
            'provider_id'   => (string) $provider1->_id,
            'provider_name' => $provider1->name,
            'type'          => 'Initial Consultation',
            'details'       => 'Need legal advice on property inheritance matters.',
            'status'        => 'accepted',
            'next_step'     => 'Awaiting scheduling confirmation.',
        ]);

        Petition::create([
            'petition_id'   => 'PET-1030',
            'citizen_id'    => (string) $citizen1->_id,
            'citizen_name'  => $citizen1->name,
            'provider_id'   => (string) $provider2->_id,
            'provider_name' => $provider2->name,
            'type'          => 'Document Verification',
            'details'       => 'Verify sale deed and mutation papers.',
            'status'        => 'pending',
            'next_step'     => 'Provider is reviewing your request.',
        ]);

        Petition::create([
            'petition_id'   => 'PET-1031',
            'citizen_id'    => (string) $citizen2->_id,
            'citizen_name'  => $citizen2->name,
            'provider_id'   => (string) $provider3->_id,
            'provider_name' => $provider3->name,
            'type'          => 'Corporate Structuring',
            'details'       => 'Need assistance with setting up an LLP and drafting initial founder agreements.',
            'status'        => 'pending',
            'next_step'     => 'Provider is reviewing your request.',
        ]);

        $this->command->info('Petitions created.');

        // ── Create transactions ──────────────────────────────────────
        Transaction::create([
            'transaction_id' => 'TRX-9821',
            'provider_id'    => (string) $provider1->_id,
            'client_name'    => 'Rajesh Verma',
            'type'           => 'Consultation Fee',
            'amount'         => 2500,
            'status'         => 'cleared',
            'date'           => now()->subDays(1)->toDateString(),
        ]);

        Transaction::create([
            'transaction_id' => 'TRX-9822',
            'provider_id'    => (string) $provider1->_id,
            'client_name'    => 'Priya Singh',
            'type'           => 'Contract Review',
            'amount'         => 10000,
            'status'         => 'pending',
            'date'           => now()->subDays(2)->toDateString(),
        ]);

        Transaction::create([
            'transaction_id' => 'TRX-9823',
            'provider_id'    => (string) $provider3->_id,
            'client_name'    => 'Amit Patel',
            'type'           => 'Consultation Fee',
            'amount'         => 3000,
            'status'         => 'cleared',
            'date'           => now()->subDays(5)->toDateString(),
        ]);

        $this->command->info('Transactions created.');
        $this->command->info('✅ MongoDB seeding complete!');
    }
}
