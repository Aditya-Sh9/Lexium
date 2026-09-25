<?php

namespace App\Console\Commands;

use App\Models\Provider;
use Illuminate\Console\Command;

class NormalizeProviderTypes extends Command
{
    protected $signature = 'lexium:normalize-provider-types {--dry-run : Report changes without saving}';
    protected $description = 'Rewrites provider service_type values ("Advocate", "Document Writer") to canonical ids ("advocate", "document-writer").';

    public function handle(): int
    {
        $changed = 0;
        foreach (Provider::all() as $provider) {
            $raw = $provider->getRawOriginal('service_type');
            $normalized = Provider::normalizeServiceType($raw);
            if ($raw === $normalized) continue;

            $this->line(sprintf('  %-28s %-18s → %s', $provider->name, json_encode($raw), $normalized));
            if (!in_array($normalized, Provider::SERVICE_TYPES, true)) {
                $this->warn("    ↳ '{$normalized}' is not a known category; left for manual review.");
                continue;
            }
            if (!$this->option('dry-run')) {
                $provider->service_type = $normalized;
                $provider->save();
            }
            $changed++;
        }

        $this->info(($this->option('dry-run') ? 'Would update ' : 'Updated ') . "{$changed} provider(s).");
        return self::SUCCESS;
    }
}
