# ─── Stage: Production Laravel + Apache ───────────────────────────────
FROM php:8.4-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libssl-dev \
    libcurl4-openssl-dev \
    pkg-config \
    libzip-dev \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install zip pcntl

# Install MongoDB PHP extension
RUN pecl install mongodb && docker-php-ext-enable mongodb

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first (for Docker layer caching)
COPY composer.json composer.lock ./

# Install PHP dependencies (no dev dependencies in production)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy the rest of the application code
COPY . .

# Run post-install scripts now that all code is present
RUN composer dump-autoload --optimize

# ─── Apache Configuration ─────────────────────────────────────────────
# Point Apache DocumentRoot to Laravel's public directory
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Enable Apache mod_rewrite for Laravel's pretty URLs
RUN a2enmod rewrite

# ─── Permissions ──────────────────────────────────────────────────────
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

# ─── Startup ─────────────────────────────────────────────────────────
# Render uses PORT env var; default to 10000
ENV PORT=10000
RUN sed -i "s/80/${PORT}/g" /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf

# Generate app key & cache config on container start
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE ${PORT}

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
