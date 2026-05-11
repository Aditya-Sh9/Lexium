#!/bin/bash
set -e

# Generate app key if not already set
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Cache config and routes for production performance
php artisan config:cache
php artisan route:cache

# Ensure storage directories exist and have correct permissions
php artisan storage:link 2>/dev/null || true
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

exec "$@"
