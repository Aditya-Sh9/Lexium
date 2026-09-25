<?php

namespace App\Http\Controllers;

abstract class Controller
{
    /**
     * Human-readable reference such as "PET-7K4Q2M". Six characters from a
     * 31-symbol alphabet (no 0/O/1/I/L) give ~887M combinations, versus the
     * 9,000 that rand(1000, 9999) allowed, so collisions are negligible.
     */
    protected function publicId(string $prefix): string
    {
        $alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        return "{$prefix}-{$code}";
    }
}
