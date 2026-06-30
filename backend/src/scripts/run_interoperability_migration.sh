#!/bin/bash

# Script pentru rularea migrației de interoperabilitate
# Rulează: bash backend/src/scripts/run_interoperability_migration.sh

echo "🚀 Rulare migrație interoperabilitate..."

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-spital_brasov}"

MIGRATION_FILE="backend/src/db/migrations/add_interoperability.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Fișierul de migrație nu a fost găsit: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Rulare fișier SQL: $MIGRATION_FILE"

if [ -z "$DB_PASSWORD" ]; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < "$MIGRATION_FILE"
else
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$MIGRATION_FILE"
fi

if [ $? -eq 0 ]; then
    echo "✅ Migrația a fost rulată cu succes!"
    
    # Verifică dacă datele au fost inserate
    echo "📊 Verificare date..."
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" -e "SELECT COUNT(*) as total FROM external_integrations;"
    
    echo "✅ Gata! Tabelele de interoperabilitate sunt create."
else
    echo "❌ Eroare la rularea migrației!"
    exit 1
fi

