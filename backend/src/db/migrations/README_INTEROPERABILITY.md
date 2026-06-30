# Migrație Interoperabilitate

## Rulare Migrație

### Opțiunea 1: Direct cu MySQL
```bash
mysql -h 127.0.0.1 -P 3306 -u root spital_brasov < backend/src/db/migrations/add_interoperability.sql
```

### Opțiunea 2: Cu script bash
```bash
bash backend/src/scripts/run_interoperability_migration.sh
```

### Opțiunea 3: Cu script Node.js
```bash
cd backend
node src/scripts/setup_interoperability.js
```

## Verificare

După rularea migrației, verifică dacă tabelele au fost create:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -e "USE spital_brasov; SHOW TABLES LIKE 'external_%';"
```

Ar trebui să vezi:
- `external_integrations`
- `external_reports`
- `integration_logs`
- `auto_report_configs`

Verifică dacă datele seed au fost inserate:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -e "USE spital_brasov; SELECT COUNT(*) FROM external_integrations;"
```

Ar trebui să returneze: **7** (7 integrări externe)

## Tabele Create

1. **external_integrations** - Configurare integrări externe (CNAS-DRG, SIUI, CM, DES, LIS, RIS/PACS, HL7/FHIR)
2. **external_reports** - Istoric rapoarte trimise către sisteme externe
3. **integration_logs** - Log-uri de comunicare cu sisteme externe
4. **auto_report_configs** - Configurare raportare automată

## Date Seed

Sunt inserate automat 7 integrări externe:
- CNAS-DRG (Raportare)
- SIUI (Verificare)
- CM - Casa de Asigurări de Sănătate (Raportare)
- DES - Direcția Executivă de Sănătate (Raportare)
- LIS - Laboratory Information System (Integrare)
- RIS/PACS (Integrare)
- HL7/FHIR (Standard)

## Note

- Dacă tabelele există deja, scriptul va folosi `CREATE TABLE IF NOT EXISTS` și `ON DUPLICATE KEY UPDATE`
- Nu va șterge date existente
- Poate fi rulat de mai multe ori în siguranță

