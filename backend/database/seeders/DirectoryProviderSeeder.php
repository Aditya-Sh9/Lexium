<?php

namespace Database\Seeders;

use App\Models\Provider;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Populates the public registry with approved demo providers so that every
 * category, common city and the landing page's common searches ("Property
 * dispute", "Divorce", "GST filing", "Affidavit", "Rent agreement") return
 * results.
 *
 * - Idempotent: users and profiles are upserted by email, so re-running
 *   updates records instead of duplicating them.
 * - Ratings are honest: rating and review_count are derived from the reviews
 *   actually stored, matching how CitizenController::submitReview recalculates.
 * - Emails use the reserved ".test" TLD; these accounts cannot sign in.
 *
 * Run: php artisan db:seed --class=DirectoryProviderSeeder
 */
class DirectoryProviderSeeder extends Seeder
{
    public function run(): void
    {
        $count = 0;
        foreach ($this->providers() as $i => $p) {
            $email = $this->slug($p['name']) . '@seed.lexium.test';

            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'firebase_uid' => sprintf('seed-provider-%03d', $i + 1),
                    'name'         => $p['name'],
                    'role'         => 'provider',
                    'status'       => 'approved',
                ]
            );

            $reviews = $this->reviewsFor($p['type'], $i);
            $rating  = round(array_sum(array_column($reviews, 'rating')) / count($reviews), 2);
            $prices  = array_map(fn ($s) => (int) preg_replace('/\D/', '', $s['price']), $p['services']);
            $fee     = $prices[0];

            Provider::updateOrCreate(
                ['user_id' => (string) $user->_id],
                [
                    'name'             => $p['name'],
                    'email'            => $email,
                    'phone'            => '',
                    'service_type'     => $p['type'],
                    'specialization'   => $p['spec'],
                    'location'         => $p['city'],
                    'experience'       => (string) $p['exp'],
                    'bio'              => $p['bio'],
                    'price_range'      => '₹' . number_format(min($prices)) . ' - ₹' . number_format(max($prices)),
                    'consultation_fee' => $fee,
                    'bar_council_id'   => $p['reg'] ?? '',
                    'languages'        => $p['langs'],
                    'availability'     => $p['hours'] ?? 'Mon - Sat | 10:00 AM - 6:00 PM',
                    'qualifications'   => $p['quals'],
                    'services'         => $p['services'],
                    'reviews'          => $reviews,
                    'rating'           => $rating,
                    'review_count'     => count($reviews),
                    'rating_count'     => count($reviews),
                    'badges'           => $rating >= 4.7 ? ['verified', 'topRated'] : ['verified'],
                    'is_verified'      => true,
                    'status'           => 'approved',
                ]
            );
            $count++;
        }

        $this->command?->info("✓ {$count} directory providers seeded as approved");
    }

    private function svc(string $name, int $price, string $duration): array
    {
        return ['name' => $name, 'price' => '₹' . number_format($price), 'duration' => $duration];
    }

    private function slug(string $name): string
    {
        $name = preg_replace('/^(Adv|Dr|CA|Arb|Notary)\.?\s+/i', '', $name);
        return trim(preg_replace('/[^a-z0-9]+/', '.', strtolower($name)), '.');
    }

    /** 3–5 deterministic reviews per provider, drawn from a pool for their practice type. */
    private function reviewsFor(string $type, int $seed): array
    {
        $authors = ['Rahul M.', 'Sneha K.', 'Vikram S.', 'Ananya R.', 'Farhan Q.', 'Pooja D.', 'Arjun N.', 'Meenakshi I.',
            'Harpreet K.', 'Suresh B.', 'Kavya P.', 'Imran S.', 'Deepa V.', 'Rohit J.', 'Lakshmi T.', 'Nikhil G.'];

        $pool = [
            'advocate' => [
                [5, 'Explained where I stood legally in plain language before quoting anything. Filing was done on time.'],
                [5, 'Prepared thoroughly for every hearing and kept me updated after each date.'],
                [4, 'Solid advice and fair fees. Replies were sometimes slow during court weeks.'],
                [5, 'Knew the local court procedure inside out. Saved us months.'],
                [4, 'Clear about the risks from day one, which I appreciated.'],
                [5, 'Patient with all my questions and never pushed me into litigation I didn’t need.'],
            ],
            'mediator' => [
                [5, 'Kept both sides calm and focused on what we could actually agree on.'],
                [5, 'We settled in two sessions what we had argued about for a year.'],
                [4, 'Very balanced. Would have liked the written summary a little sooner.'],
                [5, 'Neutral, well prepared, and good at finding middle ground.'],
                [4, 'Helpful process. The second session ran over time but it was worth it.'],
            ],
            'arbitrator' => [
                [5, 'Proceedings were well organised and the award was clearly reasoned.'],
                [4, 'Firm on timelines, which kept the matter from dragging on.'],
                [5, 'Deep commercial understanding. Both parties felt heard.'],
                [5, 'Efficient hearings and a detailed, well-structured award.'],
            ],
            'notary' => [
                [5, 'Affidavit attested in fifteen minutes. Everything was ready when I arrived.'],
                [5, 'Checked my documents carefully and pointed out a mistake before stamping.'],
                [4, 'Quick and correctly priced. Small office, so there was a short wait.'],
                [5, 'Very reliable for rent agreement notarisation.'],
                [4, 'Efficient service, clear about what ID to bring.'],
            ],
            'document-writer' => [
                [5, 'Rent agreement drafted the same day with every clause explained.'],
                [5, 'Careful drafting. Caught an error in the property description from my old deed.'],
                [4, 'Good work and fair price. Needed one round of corrections.'],
                [5, 'Prepared my affidavit and sale deed draft quickly and accurately.'],
                [4, 'Professional and precise with the stamp duty calculation.'],
            ],
            'tax-consultant' => [
                [5, 'Sorted out two years of pending GST returns without any penalty surprises.'],
                [5, 'Explained the old versus new regime properly before filing my ITR.'],
                [4, 'Accurate and on time. Busy in July, so book early.'],
                [5, 'Handled a GST notice reply calmly and got it closed.'],
                [4, 'Good at TDS reconciliation for our small business.'],
            ],
        ];

        $items = $pool[$type];
        $n = 3 + ($seed % 3);
        $reviews = [];
        for ($k = 0; $k < $n; $k++) {
            [$rating, $text] = $items[($seed + $k * 2) % count($items)];
            $reviews[] = [
                'id'     => sprintf('SEED-%03d-%d', $seed + 1, $k + 1),
                'author' => $authors[($seed * 3 + $k) % count($authors)],
                'rating' => $rating,
                'date'   => date('Y-m-d', strtotime('2026-09-10') - (($seed * 11 + $k * 23) % 200) * 86400),
                'text'   => $text,
            ];
        }
        return $reviews;
    }

    private function providers(): array
    {
        $gc = fn (int $price) => $this->svc('General Consultation', $price, '30 min');

        return [
            // ── Advocates ───────────────────────────────────────────
            ['name' => 'Adv. Rohan Mehta', 'type' => 'advocate', 'spec' => 'Property Disputes & Civil Litigation', 'city' => 'Mumbai', 'exp' => 14,
             'reg' => 'MAH/2211/2011', 'langs' => ['English', 'Hindi', 'Marathi'],
             'bio' => 'Handles title disputes, partition suits and builder-buyer conflicts before the Bombay City Civil Court and the High Court. Known for settling property disputes early where the documents support it.',
             'quals' => ['LL.B — Government Law College, Mumbai', 'Enrolled with Bar Council of Maharashtra & Goa (2011)'],
             'services' => [$gc(2000), $this->svc('Property Dispute Consultation', 3500, '60 min'), $this->svc('Title Search Report', 6000, 'Per property'), $this->svc('Partition Suit Filing', 25000, 'Per matter')]],
            ['name' => 'Adv. Kavita Rao', 'type' => 'advocate', 'spec' => 'Divorce & Family Law', 'city' => 'Bengaluru', 'exp' => 11,
             'reg' => 'KAR/1734/2014', 'langs' => ['English', 'Kannada', 'Hindi'],
             'bio' => 'Represents clients in mutual and contested divorce, child custody, maintenance and domestic violence matters at the Bengaluru Family Court. Prefers mediation where children are involved.',
             'quals' => ['B.A. LL.B (Hons) — National Law School of India University', 'Enrolled with Karnataka State Bar Council (2014)'],
             'services' => [$gc(1500), $this->svc('Mutual Divorce Filing', 20000, 'Full process'), $this->svc('Child Custody Petition', 18000, 'Per matter'), $this->svc('Maintenance Claim', 12000, 'Per matter')]],
            ['name' => 'Adv. Siddharth Malhotra', 'type' => 'advocate', 'spec' => 'Criminal Defence & Bail', 'city' => 'New Delhi', 'exp' => 16,
             'reg' => 'D/3120/2009', 'langs' => ['English', 'Hindi', 'Punjabi'],
             'bio' => 'Criminal trial lawyer at Tis Hazari and Saket courts. Regular bail, anticipatory bail, FIR quashing and trial defence, including white-collar matters.',
             'quals' => ['LL.B — Faculty of Law, University of Delhi', 'Enrolled with Bar Council of Delhi (2009)'],
             'services' => [$gc(2500), $this->svc('Anticipatory Bail Application', 15000, 'Per application'), $this->svc('FIR Quashing Petition', 30000, 'Per matter'), $this->svc('Trial Representation', 8000, 'Per hearing')]],
            ['name' => 'Adv. Fatima Sheikh', 'type' => 'advocate', 'spec' => 'Consumer Protection & Insurance Claims', 'city' => 'Hyderabad', 'exp' => 9,
             'reg' => 'TS/0981/2016', 'langs' => ['English', 'Urdu', 'Telugu', 'Hindi'],
             'bio' => 'Files and argues consumer complaints before district and state commissions: defective products, builder delays, deficient services and rejected insurance claims.',
             'quals' => ['LL.B — Osmania University', 'Enrolled with Bar Council of Telangana (2016)'],
             'services' => [$gc(1200), $this->svc('Consumer Complaint Filing', 8000, 'Per complaint'), $this->svc('Insurance Claim Dispute', 10000, 'Per matter'), $this->svc('Legal Notice Drafting', 2500, 'Per notice')]],
            ['name' => 'Adv. Arvind Iyer', 'type' => 'advocate', 'spec' => 'Rent Control & Tenancy Disputes', 'city' => 'Chennai', 'exp' => 18,
             'reg' => 'TN/1402/2007', 'langs' => ['English', 'Tamil'],
             'bio' => 'Acts for landlords and tenants in eviction, rent fixation and security deposit disputes under the Tamil Nadu tenancy law. Also reviews rent agreements before signing.',
             'quals' => ['B.L. — Dr. Ambedkar Government Law College, Chennai', 'Enrolled with Bar Council of Tamil Nadu & Puducherry (2007)'],
             'services' => [$gc(1500), $this->svc('Eviction Petition', 18000, 'Per matter'), $this->svc('Rent Agreement Review', 2000, 'Per agreement'), $this->svc('Security Deposit Recovery Notice', 3000, 'Per notice')]],
            ['name' => 'Adv. Ishita Banerjee', 'type' => 'advocate', 'spec' => 'Succession, Wills & Probate', 'city' => 'Kolkata', 'exp' => 13,
             'reg' => 'WB/0655/2012', 'langs' => ['English', 'Bengali', 'Hindi'],
             'bio' => 'Advises families on wills, probate, succession certificates and inherited property disputes before the Calcutta High Court and district courts.',
             'quals' => ['LL.B — University of Calcutta', 'LL.M (Family Law) — Jadavpur University', 'Enrolled with Bar Council of West Bengal (2012)'],
             'services' => [$gc(1500), $this->svc('Will Drafting & Registration', 7000, 'Per will'), $this->svc('Probate Petition', 22000, 'Per matter'), $this->svc('Succession Certificate', 15000, 'Per matter')]],
            ['name' => 'Adv. Gurpreet Sandhu', 'type' => 'advocate', 'spec' => 'Cheque Bounce & Money Recovery', 'city' => 'Chandigarh', 'exp' => 10,
             'reg' => 'P/1188/2015', 'langs' => ['English', 'Punjabi', 'Hindi'],
             'bio' => 'Section 138 cheque bounce complaints, summary recovery suits and settlement negotiations for individuals and small businesses in Punjab and Haryana.',
             'quals' => ['LL.B — Panjab University', 'Enrolled with Bar Council of Punjab & Haryana (2015)'],
             'services' => [$gc(1200), $this->svc('Cheque Bounce Legal Notice', 2500, 'Per notice'), $this->svc('Section 138 Complaint', 12000, 'Per matter'), $this->svc('Money Recovery Suit', 20000, 'Per matter')]],
            ['name' => 'Adv. Neelam Tripathi', 'type' => 'advocate', 'spec' => 'Property Law & Land Records', 'city' => 'Lucknow', 'exp' => 20,
             'reg' => 'UP/4410/2005', 'langs' => ['Hindi', 'English'],
             'bio' => 'Two decades in revenue and civil courts on mutation, land record corrections, encroachment and ancestral property disputes across Uttar Pradesh.',
             'quals' => ['LL.B — Lucknow University', 'Enrolled with Bar Council of Uttar Pradesh (2005)'],
             'services' => [$gc(1000), $this->svc('Property Dispute Consultation', 2500, '60 min'), $this->svc('Mutation & Land Record Correction', 8000, 'Per property'), $this->svc('Encroachment Suit', 18000, 'Per matter')]],
            ['name' => 'Adv. Rahul Deshpande', 'type' => 'advocate', 'spec' => 'Cyber Crime & Data Privacy', 'city' => 'Pune', 'exp' => 8,
             'reg' => 'MAH/5520/2017', 'langs' => ['English', 'Marathi', 'Hindi'],
             'bio' => 'Online fraud, social media defamation, identity theft and data breach matters. Works closely with cyber cells to get complaints registered and followed up.',
             'quals' => ['B.A. LL.B — Symbiosis Law School, Pune', 'PG Diploma in Cyber Law — ILS Law College', 'Enrolled with Bar Council of Maharashtra & Goa (2017)'],
             'services' => [$gc(1500), $this->svc('Cyber Fraud Complaint', 6000, 'Per complaint'), $this->svc('Defamation Takedown Notice', 4000, 'Per notice'), $this->svc('Data Privacy Advisory', 10000, 'Per engagement')]],
            ['name' => 'Adv. Anand Pillai', 'type' => 'advocate', 'spec' => 'Labour & Employment Law', 'city' => 'Kochi', 'exp' => 15,
             'reg' => 'KER/0877/2010', 'langs' => ['English', 'Malayalam'],
             'bio' => 'Wrongful termination, unpaid wages, gratuity and PF disputes for employees, plus HR policy and compliance work for employers.',
             'quals' => ['LL.B — Government Law College, Ernakulam', 'Enrolled with Bar Council of Kerala (2010)'],
             'services' => [$gc(1500), $this->svc('Wrongful Termination Claim', 15000, 'Per matter'), $this->svc('Gratuity & PF Recovery', 8000, 'Per matter'), $this->svc('Employment Contract Review', 4000, 'Per contract')]],
            ['name' => 'Adv. Pradeep Choudhary', 'type' => 'advocate', 'spec' => 'Motor Accident Claims', 'city' => 'Jaipur', 'exp' => 12,
             'reg' => 'RAJ/2290/2013', 'langs' => ['Hindi', 'English', 'Rajasthani'],
             'bio' => 'Represents accident victims and families before the Motor Accident Claims Tribunal, including negotiating with insurers for faster settlement.',
             'quals' => ['LL.B — University of Rajasthan', 'Enrolled with Bar Council of Rajasthan (2013)'],
             'services' => [$gc(1000), $this->svc('MACT Claim Petition', 12000, 'Per matter'), $this->svc('Insurance Settlement Negotiation', 6000, 'Per matter')]],
            ['name' => 'Adv. Shruti Kulkarni', 'type' => 'advocate', 'spec' => 'Divorce, Custody & Domestic Violence', 'city' => 'Nagpur', 'exp' => 7,
             'reg' => 'MAH/6034/2018', 'langs' => ['Marathi', 'Hindi', 'English'],
             'bio' => 'Family court practice focused on contested divorce, protection orders under the DV Act, and custody arrangements that keep children’s routines stable.',
             'quals' => ['LL.B — Rashtrasant Tukadoji Maharaj Nagpur University', 'Enrolled with Bar Council of Maharashtra & Goa (2018)'],
             'services' => [$gc(1000), $this->svc('Divorce Petition', 15000, 'Per matter'), $this->svc('Domestic Violence Protection Order', 10000, 'Per matter'), $this->svc('Custody & Visitation', 12000, 'Per matter')]],
            ['name' => 'Adv. Manish Agarwal', 'type' => 'advocate', 'spec' => 'Startup & Company Law', 'city' => 'Gurugram', 'exp' => 10,
             'reg' => 'HR/1543/2015', 'langs' => ['English', 'Hindi'],
             'bio' => 'Incorporation, founder agreements, ESOPs, shareholder disputes and commercial contracts for early-stage companies in the NCR.',
             'quals' => ['B.B.A. LL.B — Symbiosis Law School, Noida', 'Enrolled with Bar Council of Punjab & Haryana (2015)'],
             'services' => [$gc(2500), $this->svc('Company Incorporation', 9000, 'Full process'), $this->svc('Founders’ Agreement', 12000, 'Per agreement'), $this->svc('Shareholder Dispute Advisory', 15000, 'Per engagement')]],
            ['name' => 'Adv. Rituparna Das', 'type' => 'advocate', 'spec' => 'Civil Litigation & Property Disputes', 'city' => 'Guwahati', 'exp' => 9,
             'reg' => 'AS/0712/2016', 'langs' => ['Assamese', 'English', 'Hindi', 'Bengali'],
             'bio' => 'Civil suits, injunctions and property disputes before the Gauhati High Court and Kamrup district courts, including land patta issues.',
             'quals' => ['LL.B — Gauhati University', 'Enrolled with Bar Council of Assam, Nagaland, Meghalaya, Manipur, Tripura, Mizoram & Arunachal Pradesh (2016)'],
             'services' => [$gc(1000), $this->svc('Property Dispute Consultation', 2000, '60 min'), $this->svc('Injunction Application', 10000, 'Per matter'), $this->svc('Civil Suit Filing', 15000, 'Per matter')]],

            // ── Mediators ───────────────────────────────────────────
            ['name' => 'Dr. Leela Krishnan', 'type' => 'mediator', 'spec' => 'Family & Divorce Mediation', 'city' => 'Chennai', 'exp' => 17,
             'langs' => ['English', 'Tamil', 'Malayalam'],
             'bio' => 'Court-referred and private mediator for separating couples: parenting plans, maintenance and division of assets, without a contested divorce.',
             'quals' => ['Ph.D. Family Studies — University of Madras', 'Certified Mediator — Mediation & Conciliation Project Committee, Supreme Court of India'],
             'services' => [$gc(1500), $this->svc('Divorce Mediation Session', 4000, '2 hours'), $this->svc('Parenting Plan Agreement', 8000, 'Per plan')]],
            ['name' => 'Harish Venkatesh', 'type' => 'mediator', 'spec' => 'Commercial & Business Mediation', 'city' => 'Bengaluru', 'exp' => 12,
             'langs' => ['English', 'Kannada', 'Tamil'],
             'bio' => 'Mediates vendor, partnership and payment disputes between businesses. Former in-house counsel, so understands what companies need from a settlement.',
             'quals' => ['LL.B — Bangalore University', 'Certified Mediator — Bangalore Mediation Centre', 'CEDR Accredited Mediator'],
             'services' => [$gc(2500), $this->svc('Commercial Mediation', 12000, 'Per day'), $this->svc('Partnership Dispute Mediation', 15000, 'Per matter')]],
            ['name' => 'Farah Siddiqui', 'type' => 'mediator', 'spec' => 'Property & Neighbour Dispute Mediation', 'city' => 'Bhopal', 'exp' => 8,
             'langs' => ['Hindi', 'Urdu', 'English'],
             'bio' => 'Helps families and neighbours settle boundary, inheritance and property disputes without years in court.',
             'quals' => ['M.A. Sociology — Barkatullah University', 'Certified Mediator — MP State Legal Services Authority'],
             'services' => [$gc(1000), $this->svc('Property Dispute Mediation', 5000, 'Per session'), $this->svc('Family Settlement Deed Facilitation', 7000, 'Per matter')]],
            ['name' => 'Col. (Retd.) Vivek Bhatia', 'type' => 'mediator', 'spec' => 'Workplace & Employment Mediation', 'city' => 'Noida', 'exp' => 10,
             'langs' => ['English', 'Hindi'],
             'bio' => 'Resolves workplace grievances, harassment complaints and severance disagreements confidentially, before they escalate to litigation.',
             'quals' => ['Certified Mediator — Indian Institute of Arbitration & Mediation', 'Former member, Internal Complaints Committee panels'],
             'services' => [$gc(2000), $this->svc('Workplace Mediation', 8000, 'Per session'), $this->svc('Severance Negotiation', 10000, 'Per matter')]],
            ['name' => 'Radhika Menon', 'type' => 'mediator', 'spec' => 'Family & Elder Care Mediation', 'city' => 'Coimbatore', 'exp' => 6,
             'langs' => ['Tamil', 'Malayalam', 'English'],
             'bio' => 'Mediates family disagreements over elder care, inheritance and shared property with a focus on keeping relationships intact.',
             'quals' => ['M.S.W. — Madras School of Social Work', 'Certified Mediator — Tamil Nadu Mediation and Conciliation Centre'],
             'services' => [$gc(1000), $this->svc('Family Mediation Session', 3000, '2 hours'), $this->svc('Inheritance Settlement Mediation', 6000, 'Per matter')]],

            // ── Arbitrators ─────────────────────────────────────────
            ['name' => 'Justice (Retd.) S. N. Kapoor', 'type' => 'arbitrator', 'spec' => 'Commercial & Construction Arbitration', 'city' => 'New Delhi', 'exp' => 34,
             'langs' => ['English', 'Hindi'],
             'bio' => 'Retired High Court judge serving as sole and presiding arbitrator in construction, infrastructure and supply contract disputes.',
             'quals' => ['Former Judge, High Court of Delhi', 'Fellow, Chartered Institute of Arbitrators (FCIArb)'],
             'services' => [$gc(5000), $this->svc('Sole Arbitrator Engagement', 75000, 'Per matter'), $this->svc('Arbitration Clause Review', 8000, 'Per contract')]],
            ['name' => 'Meera Subramanian', 'type' => 'arbitrator', 'spec' => 'Commercial Contracts Arbitration', 'city' => 'Mumbai', 'exp' => 19,
             'langs' => ['English', 'Tamil', 'Hindi'],
             'bio' => 'Arbitrates commercial contract, distribution and franchise disputes under institutional and ad hoc rules. Known for tight procedural timetables.',
             'quals' => ['LL.M — University of Cambridge', 'Panel Arbitrator — Mumbai Centre for International Arbitration'],
             'services' => [$gc(4000), $this->svc('Institutional Arbitration', 60000, 'Per matter'), $this->svc('Expedited Arbitration', 35000, 'Per matter')]],
            ['name' => 'Rajiv Saxena', 'type' => 'arbitrator', 'spec' => 'Real Estate & Builder Disputes', 'city' => 'Indore', 'exp' => 15,
             'langs' => ['Hindi', 'English'],
             'bio' => 'Resolves builder-buyer and joint development disputes through arbitration, typically within six to nine months.',
             'quals' => ['LL.M — Devi Ahilya Vishwavidyalaya', 'Panel Arbitrator — Indian Council of Arbitration'],
             'services' => [$gc(2500), $this->svc('Builder-Buyer Arbitration', 40000, 'Per matter'), $this->svc('Joint Development Dispute', 50000, 'Per matter')]],
            ['name' => 'Aparna Hegde', 'type' => 'arbitrator', 'spec' => 'Technology & IP Licensing Arbitration', 'city' => 'Bengaluru', 'exp' => 13,
             'langs' => ['English', 'Kannada'],
             'bio' => 'Arbitrates software licensing, SaaS service-level and IP royalty disputes, drawing on a decade of technology transactions practice.',
             'quals' => ['B.Tech & LL.B — IIT Kharagpur', 'Member, Singapore International Arbitration Centre Users Council'],
             'services' => [$gc(3500), $this->svc('Technology Contract Arbitration', 55000, 'Per matter'), $this->svc('Emergency Arbitrator Application', 30000, 'Per application')]],

            // ── Notaries ────────────────────────────────────────────
            ['name' => 'Notary Ramesh Gupta', 'type' => 'notary', 'spec' => 'Affidavits & Document Attestation', 'city' => 'New Delhi', 'exp' => 22,
             'reg' => 'NOT/DL/2003/118', 'langs' => ['Hindi', 'English'], 'hours' => 'Mon - Sat | 9:30 AM - 7:00 PM',
             'bio' => 'Government-appointed notary near Karkardooma courts. Affidavits, attestation of copies, and rent agreement notarisation, usually while you wait.',
             'quals' => ['Appointed Notary, Government of NCT of Delhi (2003)', 'LL.B — Faculty of Law, University of Delhi'],
             'services' => [$gc(300), $this->svc('Affidavit Attestation', 300, 'Per document'), $this->svc('Rent Agreement Notarisation', 500, 'Per agreement'), $this->svc('True Copy Attestation', 100, 'Per page')]],
            ['name' => 'Notary Sunanda Patil', 'type' => 'notary', 'spec' => 'Affidavits, Rent Agreements & Power of Attorney', 'city' => 'Pune', 'exp' => 15,
             'reg' => 'NOT/MH/2010/402', 'langs' => ['Marathi', 'Hindi', 'English'],
             'bio' => 'Notarises affidavits, rent agreements, powers of attorney and declarations. Home visits available for senior citizens.',
             'quals' => ['Appointed Notary, Government of Maharashtra (2010)', 'LL.B — ILS Law College, Pune'],
             'services' => [$gc(300), $this->svc('Affidavit Attestation', 350, 'Per document'), $this->svc('Rent Agreement Notarisation', 600, 'Per agreement'), $this->svc('Power of Attorney Attestation', 800, 'Per document')]],
            ['name' => 'Notary Abdul Rahman', 'type' => 'notary', 'spec' => 'Document Attestation & Affidavits', 'city' => 'Hyderabad', 'exp' => 18,
             'reg' => 'NOT/TS/2007/077', 'langs' => ['Urdu', 'Telugu', 'English', 'Hindi'],
             'bio' => 'Attestation of affidavits, educational documents for visa applications, and name-change declarations.',
             'quals' => ['Appointed Notary, Government of India (2007)', 'LL.B — Osmania University'],
             'services' => [$gc(300), $this->svc('Affidavit Attestation', 300, 'Per document'), $this->svc('Name Change Affidavit', 700, 'Per document'), $this->svc('Visa Document Attestation', 200, 'Per page')]],
            ['name' => 'Notary Priti Shah', 'type' => 'notary', 'spec' => 'Rent Agreements & Sale Deed Notarisation', 'city' => 'Ahmedabad', 'exp' => 12,
             'reg' => 'NOT/GJ/2013/260', 'langs' => ['Gujarati', 'Hindi', 'English'],
             'bio' => 'Notarisation for rent agreements, agreements to sell and affidavits, with guidance on the stamp paper needed in Gujarat.',
             'quals' => ['Appointed Notary, Government of Gujarat (2013)', 'LL.B — Gujarat University'],
             'services' => [$gc(300), $this->svc('Rent Agreement Notarisation', 500, 'Per agreement'), $this->svc('Affidavit Attestation', 300, 'Per document'), $this->svc('Agreement to Sell Notarisation', 1000, 'Per document')]],
            ['name' => 'Notary Bijoy Mohanty', 'type' => 'notary', 'spec' => 'Affidavits & Declarations', 'city' => 'Bhubaneswar', 'exp' => 16,
             'reg' => 'NOT/OD/2009/045', 'langs' => ['Odia', 'Hindi', 'English'],
             'bio' => 'Affidavits for gap years, income, residence and name correction, plus attestation for government job applications.',
             'quals' => ['Appointed Notary, Government of Odisha (2009)', 'LL.B — Utkal University'],
             'services' => [$gc(200), $this->svc('Affidavit Attestation', 250, 'Per document'), $this->svc('Income / Residence Declaration', 300, 'Per document')]],
            ['name' => 'Notary Kamala Devi', 'type' => 'notary', 'spec' => 'Affidavits & Rent Agreement Notarisation', 'city' => 'Patna', 'exp' => 20,
             'reg' => 'NOT/BR/2005/033', 'langs' => ['Hindi', 'Maithili', 'English'],
             'bio' => 'Civil court notary handling affidavits, rent agreements and marriage declarations.',
             'quals' => ['Appointed Notary, Government of Bihar (2005)', 'LL.B — Patna University'],
             'services' => [$gc(200), $this->svc('Affidavit Attestation', 250, 'Per document'), $this->svc('Rent Agreement Notarisation', 400, 'Per agreement'), $this->svc('Marriage Declaration Affidavit', 500, 'Per document')]],

            // ── Document Writers ────────────────────────────────────
            ['name' => 'Mahesh Joshi', 'type' => 'document-writer', 'spec' => 'Rent Agreements & Leave and Licence', 'city' => 'Mumbai', 'exp' => 16,
             'langs' => ['Marathi', 'Hindi', 'English', 'Gujarati'],
             'bio' => 'Drafts and e-registers leave and licence agreements with the Maharashtra IGR, including biometric appointments at your home.',
             'quals' => ['Licensed Document Writer — Inspector General of Registration, Maharashtra', 'B.Com — University of Mumbai'],
             'services' => [$gc(500), $this->svc('Rent Agreement Drafting & E-Registration', 2500, 'Per agreement'), $this->svc('Rent Agreement Renewal', 1500, 'Per agreement')]],
            ['name' => 'Suresh Nair', 'type' => 'document-writer', 'spec' => 'Sale Deeds, Gift Deeds & Wills', 'city' => 'Kochi', 'exp' => 21,
             'langs' => ['Malayalam', 'English'],
             'bio' => 'Licensed document writer at the Ernakulam sub-registrar office for sale deeds, gift deeds, partition deeds and wills.',
             'quals' => ['Licensed Document Writer — Registration Department, Kerala'],
             'services' => [$gc(500), $this->svc('Sale Deed Drafting', 5000, 'Per deed'), $this->svc('Gift Deed Drafting', 3500, 'Per deed'), $this->svc('Will Drafting', 3000, 'Per will')]],
            ['name' => 'Anjali Verma', 'type' => 'document-writer', 'spec' => 'Affidavits & Legal Drafting', 'city' => 'Lucknow', 'exp' => 8,
             'langs' => ['Hindi', 'English'],
             'bio' => 'Drafts affidavits, declarations, legal notices and applications in Hindi and English. Most documents ready the same day.',
             'quals' => ['Licensed Document Writer — Stamp & Registration Department, Uttar Pradesh', 'LL.B — Lucknow University'],
             'services' => [$gc(300), $this->svc('Affidavit Drafting', 500, 'Per document'), $this->svc('Legal Notice Drafting', 1500, 'Per notice'), $this->svc('Rent Agreement Drafting', 1200, 'Per agreement')]],
            ['name' => 'Kiran Reddy', 'type' => 'document-writer', 'spec' => 'Property Documentation & Registration', 'city' => 'Hyderabad', 'exp' => 13,
             'langs' => ['Telugu', 'English', 'Hindi'],
             'bio' => 'Prepares sale deeds, agreements of sale and development agreements, and handles registration slots and stamp duty calculation in Telangana.',
             'quals' => ['Licensed Document Writer — Registration & Stamps Department, Telangana'],
             'services' => [$gc(500), $this->svc('Agreement of Sale Drafting', 3000, 'Per document'), $this->svc('Sale Deed Drafting & Registration', 6000, 'Per deed'), $this->svc('Rent Agreement Drafting', 1500, 'Per agreement')]],
            ['name' => 'Harsha Bhatt', 'type' => 'document-writer', 'spec' => 'Rent Agreements & Power of Attorney', 'city' => 'Surat', 'exp' => 10,
             'langs' => ['Gujarati', 'Hindi', 'English'],
             'bio' => 'Drafts rent agreements, general and special powers of attorney, and partnership deeds for traders and families in Surat.',
             'quals' => ['Licensed Document Writer — Gujarat Registration Department'],
             'services' => [$gc(300), $this->svc('Rent Agreement Drafting', 1000, 'Per agreement'), $this->svc('Power of Attorney Drafting', 1500, 'Per document'), $this->svc('Partnership Deed Drafting', 3500, 'Per deed')]],
            ['name' => 'Tapan Chatterjee', 'type' => 'document-writer', 'spec' => 'Wills, Affidavits & Family Settlement Deeds', 'city' => 'Kolkata', 'exp' => 24,
             'langs' => ['Bengali', 'English', 'Hindi'],
             'bio' => 'Long-standing deed writer at the Alipore registry: wills, family settlement deeds, affidavits and gift deeds.',
             'quals' => ['Licensed Deed Writer — Directorate of Registration & Stamp Revenue, West Bengal'],
             'services' => [$gc(400), $this->svc('Will Drafting', 2500, 'Per will'), $this->svc('Family Settlement Deed', 4000, 'Per deed'), $this->svc('Affidavit Drafting', 500, 'Per document')]],
            ['name' => 'Pooja Arora', 'type' => 'document-writer', 'spec' => 'Rent Agreements & Tenant Verification', 'city' => 'Gurugram', 'exp' => 6,
             'langs' => ['Hindi', 'English', 'Punjabi'],
             'bio' => 'Rent agreements on e-stamp paper with police tenant verification handled for you. Popular with people relocating for work.',
             'quals' => ['Licensed Document Writer — Revenue Department, Haryana'],
             'services' => [$gc(300), $this->svc('Rent Agreement on E-Stamp', 1200, 'Per agreement'), $this->svc('Tenant Police Verification', 800, 'Per tenant')]],

            // ── Tax Consultants ─────────────────────────────────────
            ['name' => 'CA Nitin Jain', 'type' => 'tax-consultant', 'spec' => 'GST Filing & Compliance', 'city' => 'New Delhi', 'exp' => 12,
             'langs' => ['Hindi', 'English'],
             'bio' => 'Monthly and quarterly GST return filing, GST registration and reconciliation for traders, e-commerce sellers and service firms.',
             'quals' => ['Chartered Accountant — ICAI (2013)', 'B.Com (Hons) — Shri Ram College of Commerce'],
             'services' => [$gc(1000), $this->svc('GST Registration', 2500, 'One-time'), $this->svc('GST Return Filing', 1500, 'Per month'), $this->svc('GST Notice Reply', 5000, 'Per notice')]],
            ['name' => 'CA Deepika Srinivasan', 'type' => 'tax-consultant', 'spec' => 'Income Tax Returns & Tax Planning', 'city' => 'Chennai', 'exp' => 10,
             'langs' => ['Tamil', 'English'],
             'bio' => 'ITR filing for salaried people, freelancers and NRIs, including capital gains and advice on choosing the right tax regime.',
             'quals' => ['Chartered Accountant — ICAI (2015)', 'Diploma in International Taxation — ICAI'],
             'services' => [$gc(800), $this->svc('ITR Filing (Salaried)', 1500, 'Per return'), $this->svc('ITR Filing (Capital Gains)', 4000, 'Per return'), $this->svc('NRI Tax Advisory', 6000, 'Per engagement')]],
            ['name' => 'Rakesh Goyal', 'type' => 'tax-consultant', 'spec' => 'GST Filing, TDS & Small Business Accounting', 'city' => 'Jaipur', 'exp' => 15,
             'langs' => ['Hindi', 'English'],
             'bio' => 'Bookkeeping, GST filing and TDS returns for small manufacturers and shops. One point of contact for all monthly compliance.',
             'quals' => ['Cost Accountant — ICMAI', 'M.Com — University of Rajasthan'],
             'services' => [$gc(700), $this->svc('GST Return Filing', 1200, 'Per month'), $this->svc('TDS Return Filing', 1500, 'Per quarter'), $this->svc('Monthly Bookkeeping', 3000, 'Per month')]],
            ['name' => 'CA Swati Kulkarni', 'type' => 'tax-consultant', 'spec' => 'Startup Tax & GST Advisory', 'city' => 'Pune', 'exp' => 9,
             'langs' => ['Marathi', 'English', 'Hindi'],
             'bio' => 'Tax structuring, GST on SaaS and export of services, and ESOP taxation for startups and their founders.',
             'quals' => ['Chartered Accountant — ICAI (2016)', 'CS (Executive) — ICSI'],
             'services' => [$gc(1500), $this->svc('GST Filing for Startups', 2500, 'Per month'), $this->svc('ESOP Tax Advisory', 8000, 'Per engagement'), $this->svc('Export of Services (LUT) Filing', 3000, 'Per year')]],
            ['name' => 'Mohammed Irfan', 'type' => 'tax-consultant', 'spec' => 'Income Tax Notices & Scrutiny', 'city' => 'Bengaluru', 'exp' => 14,
             'langs' => ['English', 'Kannada', 'Urdu', 'Hindi'],
             'bio' => 'Responds to income tax notices, handles scrutiny assessments and files appeals before the Commissioner (Appeals).',
             'quals' => ['Chartered Accountant — ICAI (2011)', 'LL.B — Bangalore University'],
             'services' => [$gc(1500), $this->svc('Income Tax Notice Reply', 5000, 'Per notice'), $this->svc('Scrutiny Assessment Representation', 15000, 'Per matter'), $this->svc('ITR Filing', 2000, 'Per return')]],
            ['name' => 'CA Prakash Sethi', 'type' => 'tax-consultant', 'spec' => 'GST Filing & Audit', 'city' => 'Indore', 'exp' => 18,
             'langs' => ['Hindi', 'English'],
             'bio' => 'GST annual returns, GST audits and input tax credit reconciliation for mid-sized businesses across Madhya Pradesh.',
             'quals' => ['Chartered Accountant — ICAI (2007)', 'DISA — ICAI'],
             'services' => [$gc(1000), $this->svc('GST Annual Return Filing', 6000, 'Per year'), $this->svc('GST Return Filing', 1500, 'Per month'), $this->svc('Input Tax Credit Reconciliation', 4000, 'Per quarter')]],
        ];
    }
}
