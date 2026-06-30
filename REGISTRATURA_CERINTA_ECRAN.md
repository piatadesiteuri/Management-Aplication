## Registratură – tabel de corespondență cerință → ecran / endpoint

| Cerință (din modelul oficial) | Unde se demonstrează (UI) | Endpoint-uri relevante |
|---|---|---|
| Model explicit LUCRARE vs ACT | `/admin/registry` (copy + tab-uri) | (documentație) `REGISTRATURA_DESCRIERE.md` |
| Registrul Unic = evidență lucrări | Tab **Registrul Unic (Lucrări)** | `GET /api/registry/works?unicRegisterId=&year=&search=` |
| Numerotare unică RU/an | Lista lucrări + detalii lucrare (ex: RU-YYYY-000123) | alocare contor: `registry_counters` (tranzacțional) |
| Registre de acte per structură | Tab **Registre de acte (Acte)** + dropdown | `GET /api/registry/registers?year=` |
| Numerotare unică per registru/an | Listă acte (ex: ACT-Dx-YYYY-####) | `GET /api/registry/entries?registerId=&year=` |
| Recepție ghișeu (fizic) | „Recepție lucrare (ghișeu/online)” canal=PHYSICAL | `POST /api/registry/works` |
| Recepție online (automatizată) | „Recepție lucrare” canal=ONLINE | `POST /api/registry/works` |
| Repartizare | Detalii lucrare → „Repartizează” | `PUT /api/registry/works/:workId/assign` |
| Circulație internă (transfer) | Detalii lucrare → „Transfer” + istoric traseu | `POST /api/registry/works/:workId/transfer` |
| Asociere acte ↔ lucrare | Detalii lucrare → „Acte asociate” + „Adaugă act” | `POST /api/registry/works/:workId/entries`, `GET /api/registry/works/:workId` |
| Închidere de an (proces) | Tab **Închidere de an** | `POST /api/registry/admin/rollover` |
| Auditabilitate | (implicit) `ActivityLogsPage` / DB `activity_logs` | acțiuni: `REGISTRY_*` |


