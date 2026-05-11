<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Provider;

class MockProviderSeeder extends Seeder
{
    /**
     * Seeds:
     * 1. One admin account (admin@gmail.com / admin123) — direct MongoDB auth
     * 2. Eight pre-approved mock providers from the original data/providers.js
     */
    public function run(): void
    {
        // ── Admin Account ────────────────────────────────────────
        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'firebase_uid'  => 'admin-system-uid',
                'name'          => 'System Administrator',
                'role'          => 'admin',
                'status'        => 'active',
                'password_hash' => bcrypt('admin123'),
            ]
        );
        $this->command->info('✓ Admin account seeded (admin@gmail.com / admin123)');

        // ── Mock Providers ───────────────────────────────────────
        $providers = [
            [
                'uid'            => 'mock-provider-001',
                'name'           => 'Adv. Priya Sharma',
                'email'          => 'priya.sharma@lexium.in',
                'service_type'   => 'Advocate',
                'specialization' => 'Corporate & Business Law',
                'location'       => 'New Delhi',
                'experience'     => '12',
                'bio'            => 'Senior advocate with 12+ years of experience in corporate law, mergers & acquisitions, and business disputes. Successfully handled 500+ cases for Fortune 500 clients across India.',
                'price_range'    => '₹2,000 - ₹5,000',
                'consultation_fee' => 3000,
                'rating'         => 4.9,
                'review_count'   => 127,
                'bar_council_id' => 'DL/1234/2013',
                'languages'      => ['English', 'Hindi'],
                'badges'         => ['verified', 'topRated'],
                'qualifications' => [
                    'B.A. LL.B (Hons) — National Law University, Delhi',
                    'LL.M in Corporate Law — University of Oxford',
                    'Enrolled with Bar Council of Delhi (2013)',
                ],
                'services' => [
                    ['name' => 'Legal Consultation', 'price' => '₹2,000', 'duration' => '30 min'],
                    ['name' => 'Contract Drafting', 'price' => '₹5,000', 'duration' => 'Per document'],
                    ['name' => 'Business Registration', 'price' => '₹8,000', 'duration' => 'Full process'],
                    ['name' => 'Merger Advisory', 'price' => '₹15,000', 'duration' => 'Per engagement'],
                ],
                'reviews' => [
                    ['id' => 'r1', 'author' => 'Rahul M.', 'rating' => 5, 'date' => '2026-03-15', 'text' => 'Extremely professional and knowledgeable.'],
                    ['id' => 'r2', 'author' => 'Sneha K.', 'rating' => 5, 'date' => '2026-02-28', 'text' => 'Best corporate lawyer I have worked with.'],
                ],
            ],
            [
                'uid'            => 'mock-provider-002',
                'name'           => 'Dr. Rajesh Kumar',
                'email'          => 'rajesh.kumar@lexium.in',
                'service_type'   => 'Mediator',
                'specialization' => 'Family & Civil Mediation',
                'location'       => 'Mumbai',
                'experience'     => '15',
                'bio'            => 'Certified mediator with 15 years of experience in family disputes, property settlements, and workplace conflicts.',
                'price_range'    => '₹1,500 - ₹4,000',
                'consultation_fee' => 2500,
                'rating'         => 4.8,
                'review_count'   => 89,
                'bar_council_id' => null,
                'languages'      => ['English', 'Hindi', 'Marathi'],
                'badges'         => ['verified', 'fastResponder'],
                'qualifications' => [
                    'Ph.D. in Conflict Resolution — TISS Mumbai',
                    'Certified Mediator — Mediation & Conciliation Project Committee',
                ],
                'services' => [
                    ['name' => 'Initial Consultation', 'price' => '₹1,500', 'duration' => '45 min'],
                    ['name' => 'Family Mediation Session', 'price' => '₹4,000', 'duration' => '2 hours'],
                ],
                'reviews' => [
                    ['id' => 'r4', 'author' => 'Meera S.', 'rating' => 5, 'date' => '2026-03-20', 'text' => 'Helped resolve our family property dispute.'],
                ],
            ],
            [
                'uid'            => 'mock-provider-003',
                'name'           => 'Adv. Anjali Desai',
                'email'          => 'anjali.desai@lexium.in',
                'service_type'   => 'Advocate',
                'specialization' => 'Criminal Defense',
                'location'       => 'Bangalore',
                'experience'     => '18',
                'bio'            => 'Renowned criminal defense attorney with a remarkable 85% acquittal rate. Specializes in white-collar crimes and cybercrime.',
                'price_range'    => '₹3,000 - ₹10,000',
                'consultation_fee' => 5000,
                'rating'         => 4.7,
                'review_count'   => 203,
                'bar_council_id' => 'KA/5678/2008',
                'languages'      => ['English', 'Hindi', 'Kannada'],
                'badges'         => ['verified', 'topRated', 'fastResponder'],
                'qualifications' => [
                    'B.A. LL.B — National Law School, Bangalore',
                    'LL.M in Criminal Law — Harvard Law School',
                ],
                'services' => [
                    ['name' => 'Criminal Consultation', 'price' => '₹3,000', 'duration' => '30 min'],
                    ['name' => 'Bail Application', 'price' => '₹10,000', 'duration' => 'Per case'],
                ],
                'reviews' => [
                    ['id' => 'r6', 'author' => 'Suresh R.', 'rating' => 5, 'date' => '2026-04-01', 'text' => 'Got us bail within 48 hours.'],
                ],
            ],
            [
                'uid'            => 'mock-provider-004',
                'name'           => 'Notary K.P. Singh',
                'email'          => 'kp.singh@lexium.in',
                'service_type'   => 'Notary',
                'specialization' => 'Document Authentication',
                'location'       => 'Lucknow',
                'experience'     => '20',
                'bio'            => 'Government-appointed notary with 20 years of impeccable service.',
                'price_range'    => '₹200 - ₹1,000',
                'consultation_fee' => 500,
                'rating'         => 4.6,
                'review_count'   => 312,
                'bar_council_id' => null,
                'languages'      => ['English', 'Hindi'],
                'badges'         => ['verified'],
                'qualifications' => [
                    'LL.B — Lucknow University',
                    'Appointed Notary Public — Government of Uttar Pradesh',
                ],
                'services' => [
                    ['name' => 'Affidavit Notarization', 'price' => '₹200', 'duration' => '15 min'],
                    ['name' => 'Power of Attorney', 'price' => '₹500', 'duration' => '30 min'],
                ],
                'reviews' => [
                    ['id' => 'r8', 'author' => 'Aarti G.', 'rating' => 5, 'date' => '2026-03-10', 'text' => 'Quick and reliable service.'],
                ],
            ],
            [
                'uid'            => 'mock-provider-005',
                'name'           => 'Arb. Sunita Reddy',
                'email'          => 'sunita.reddy@lexium.in',
                'service_type'   => 'Arbitrator',
                'specialization' => 'Commercial Arbitration',
                'location'       => 'Hyderabad',
                'experience'     => '22',
                'bio'            => 'Internationally accredited arbitrator specializing in commercial disputes.',
                'price_range'    => '₹5,000 - ₹20,000',
                'consultation_fee' => 10000,
                'rating'         => 4.9,
                'review_count'   => 56,
                'bar_council_id' => null,
                'languages'      => ['English', 'Hindi', 'Telugu'],
                'badges'         => ['verified', 'topRated'],
                'qualifications' => [
                    'B.A. LL.B — Osmania University',
                    'LL.M in International Arbitration — Queen Mary, London',
                ],
                'services' => [
                    ['name' => 'Arbitration Consultation', 'price' => '₹5,000', 'duration' => '1 hour'],
                    ['name' => 'Domestic Arbitration', 'price' => '₹20,000', 'duration' => 'Per hearing'],
                ],
                'reviews' => [
                    ['id' => 'r10', 'author' => 'Tech Solutions Pvt Ltd', 'rating' => 5, 'date' => '2026-04-05', 'text' => 'Exceptional professionalism.'],
                ],
            ],
            [
                'uid'            => 'mock-provider-006',
                'name'           => 'Sanjay Patel',
                'email'          => 'sanjay.patel@lexium.in',
                'service_type'   => 'Document Writer',
                'specialization' => 'Legal Documentation',
                'location'       => 'Ahmedabad',
                'experience'     => '10',
                'bio'            => 'Professional legal document writer with expertise in petitions, affidavits, contracts, and wills.',
                'price_range'    => '₹500 - ₹3,000',
                'consultation_fee' => 1000,
                'rating'         => 4.5,
                'review_count'   => 178,
                'bar_council_id' => null,
                'languages'      => ['English', 'Hindi', 'Gujarati'],
                'badges'         => ['verified', 'fastResponder'],
                'qualifications' => [
                    'LL.B — Gujarat University',
                    'Diploma in Legal Drafting — Indian Law Institute',
                ],
                'services' => [
                    ['name' => 'Rental Agreement', 'price' => '₹500', 'duration' => '1 day'],
                    ['name' => 'Will Drafting', 'price' => '₹2,000', 'duration' => '2-3 days'],
                ],
                'reviews' => [
                    ['id' => 'r11', 'author' => 'Kavita J.', 'rating' => 5, 'date' => '2026-03-18', 'text' => 'Very professional and affordable.'],
                ],
            ],
            [
                'uid'            => 'mock-provider-007',
                'name'           => 'Adv. Neha Gupta',
                'email'          => 'neha.gupta@lexium.in',
                'service_type'   => 'Advocate',
                'specialization' => 'Family & Matrimonial Law',
                'location'       => 'Pune',
                'experience'     => '9',
                'bio'            => 'Compassionate family law attorney specializing in divorce, custody, and domestic violence cases.',
                'price_range'    => '₹2,500 - ₹7,000',
                'consultation_fee' => 3500,
                'rating'         => 4.8,
                'review_count'   => 156,
                'bar_council_id' => 'MH/9101/2017',
                'languages'      => ['English', 'Hindi', 'Marathi'],
                'badges'         => ['verified', 'topRated'],
                'qualifications' => [
                    'B.A. LL.B (Hons) — ILS Law College, Pune',
                    'LL.M in Family Law — Mumbai University',
                ],
                'services' => [
                    ['name' => 'Family Law Consultation', 'price' => '₹2,500', 'duration' => '30 min'],
                    ['name' => 'Divorce Petition Filing', 'price' => '₹7,000', 'duration' => 'Per case'],
                ],
                'reviews' => [
                    ['id' => 'r13', 'author' => 'Anonymous', 'rating' => 5, 'date' => '2026-03-22', 'text' => 'Incredibly supportive during a very difficult time.'],
                ],
            ],
            [
                'uid'            => 'mock-provider-008',
                'name'           => 'CA Vivek Iyer',
                'email'          => 'vivek.iyer@lexium.in',
                'service_type'   => 'Tax Consultant',
                'specialization' => 'Tax Planning & GST',
                'location'       => 'Chennai',
                'experience'     => '14',
                'bio'            => 'Chartered Accountant and tax consultant with deep expertise in income tax and GST compliance.',
                'price_range'    => '₹1,000 - ₹5,000',
                'consultation_fee' => 2000,
                'rating'         => 4.7,
                'review_count'   => 94,
                'bar_council_id' => null,
                'languages'      => ['English', 'Hindi', 'Tamil'],
                'badges'         => ['verified'],
                'qualifications' => [
                    'B.Com (Hons) — Loyola College, Chennai',
                    'Chartered Accountant — ICAI',
                ],
                'services' => [
                    ['name' => 'Tax Consultation', 'price' => '₹1,000', 'duration' => '30 min'],
                    ['name' => 'ITR Filing', 'price' => '₹2,000', 'duration' => 'Per filing'],
                ],
                'reviews' => [
                    ['id' => 'r15', 'author' => 'Startup Hub Pvt Ltd', 'rating' => 5, 'date' => '2026-04-10', 'text' => 'Extremely reliable and always up to date.'],
                ],
            ],
        ];

        foreach ($providers as $p) {
            $user = User::updateOrCreate(
                ['email' => $p['email']],
                [
                    'firebase_uid' => $p['uid'],
                    'name'         => $p['name'],
                    'role'         => 'provider',
                    'status'       => 'approved',
                ]
            );

            Provider::updateOrCreate(
                ['user_id' => (string) $user->_id],
                [
                    'name'             => $p['name'],
                    'email'            => $p['email'],
                    'service_type'     => $p['service_type'],
                    'specialization'   => $p['specialization'],
                    'location'         => $p['location'],
                    'experience'       => $p['experience'],
                    'bio'              => $p['bio'],
                    'price_range'      => $p['price_range'],
                    'consultation_fee' => $p['consultation_fee'],
                    'rating'           => $p['rating'],
                    'review_count'     => $p['review_count'],
                    'rating_count'     => $p['review_count'],
                    'bar_council_id'   => $p['bar_council_id'],
                    'languages'        => $p['languages'],
                    'badges'           => $p['badges'],
                    'qualifications'   => $p['qualifications'],
                    'services'         => $p['services'],
                    'reviews'          => $p['reviews'],
                    'is_verified'      => true,
                    'status'           => 'approved',
                ]
            );
        }

        $this->command->info('✓ ' . count($providers) . ' mock providers seeded as approved');

        // ── Pending Providers (for testing admin approval) ───────
        $pendingProviders = [
            [
                'uid'            => 'pending-provider-001',
                'name'           => 'Adv. Ravi Menon',
                'email'          => 'ravi.menon@lexium.in',
                'service_type'   => 'Advocate',
                'specialization' => 'Intellectual Property Law',
                'location'       => 'Kochi',
                'experience'     => '6',
                'bio'            => 'Young and dynamic IP lawyer passionate about protecting creators and innovators.',
                'price_range'    => '₹2,000 - ₹6,000',
                'consultation_fee' => 3000,
                'bar_council_id' => 'KL/3456/2020',
                'languages'      => ['English', 'Hindi', 'Malayalam'],
            ],
            [
                'uid'            => 'pending-provider-002',
                'name'           => 'Adv. Meera Joshi',
                'email'          => 'meera.joshi@lexium.in',
                'service_type'   => 'Advocate',
                'specialization' => 'Environmental Law',
                'location'       => 'Jaipur',
                'experience'     => '4',
                'bio'            => 'Environmental law specialist focused on conservation and sustainability litigation.',
                'price_range'    => '₹1,500 - ₹4,000',
                'consultation_fee' => 2000,
                'bar_council_id' => 'RJ/7890/2022',
                'languages'      => ['English', 'Hindi'],
            ],
        ];

        foreach ($pendingProviders as $p) {
            $user = User::updateOrCreate(
                ['email' => $p['email']],
                [
                    'firebase_uid' => $p['uid'],
                    'name'         => $p['name'],
                    'role'         => 'provider',
                    'status'       => 'pending',
                ]
            );

            Provider::updateOrCreate(
                ['user_id' => (string) $user->_id],
                [
                    'name'             => $p['name'],
                    'email'            => $p['email'],
                    'service_type'     => $p['service_type'],
                    'specialization'   => $p['specialization'],
                    'location'         => $p['location'],
                    'experience'       => $p['experience'],
                    'bio'              => $p['bio'],
                    'price_range'      => $p['price_range'],
                    'consultation_fee' => $p['consultation_fee'],
                    'bar_council_id'   => $p['bar_council_id'],
                    'languages'        => $p['languages'] ?? [],
                    'is_verified'      => false,
                    'status'           => 'pending',
                    'rating'           => 0,
                    'review_count'     => 0,
                ]
            );
        }
        $this->command->info('✓ ' . count($pendingProviders) . ' pending providers seeded for admin testing');

        // ── Test Citizen Account ────────────────────────────────
        User::updateOrCreate(
            ['email' => 'citizen@gmail.com'],
            [
                'firebase_uid' => 'test-citizen-uid',
                'name'         => 'Test Citizen',
                'role'         => 'citizen',
                'status'       => 'active',
            ]
        );
        $this->command->info('✓ Test citizen account seeded (citizen@gmail.com)');
    }
}
