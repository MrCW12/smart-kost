#!/bin/bash
set -e

cd /var/www

if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
  php artisan key:generate --force --no-interaction
fi

php artisan storage:link --force || true
php artisan migrate --force --no-interaction || true

if [ -n "$APP_SEED" ]; then
  php artisan db:seed --force --no-interaction || true
fi

php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
