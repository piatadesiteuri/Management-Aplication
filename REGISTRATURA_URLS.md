## Modul: Registratură (MVP) – URL-uri pentru dovadă / navigare

### Ce avem implementat acum (în aplicația ta)
- **Registrul Unic (LUCRĂRI)**: listare lucrări (intrări/ieșiri/interne) + numerotare unică instituție/an + detalii (acte asociate + traseu).
- **Registre de acte (ACTE)**: listare acte pe registru selectat + numerotare unică per registru/an.
- **Recepție (ghișeu/online)**: creare LUCRARE + ACT asociat, cu canal:
  - **Ghișeu (fizic)** = `PHYSICAL`
  - **Online** = `ONLINE`
  - **Intern** = `INTERNAL`
- **Repartizare**: UI + API pentru repartizarea lucrării (status flux).
- **Circulație internă**: UI + API pentru transfer între structuri + istoric traseu.
- **Închidere de an**: proces (endpoint + UI) care arhivează registrele și lucrările anului curent și generează Registrul Unic pentru anul următor.
- **Audit**: fiecare acțiune cheie este logată în `activity_logs` (ex: creare registru, creare înregistrare, repartizare, închidere de an).

---

## URL-uri cerute în propunerea tehnică (în aplicație)

### 1) Vizualizarea Registrului Unic de lucrări
- **URL**: `/admin/registry`
- **Tab**: `Registrul Unic (Lucrări)`

### 2) Vizualizarea Registrelor de acte
- **URL**: `/admin/registry`
- **Tab**: `Registre de acte (Acte)`

### 3) Pagina de generare și parametrizare a registrelor (toate)
- **URL**: `/admin/registry`
- **Tab**: `Parametrizare registre`
- **Navigare recomandată (profesional)**:
  - selectezi anul (sus dreapta)
  - creezi/administrzi registrele pentru acel an (Registru Unic + Registre de acte)
  - verifici status: **ACTIVE** (an curent) / **ARCHIVED** (an închis)

### 4) Dovadă automatizare „închidere de an”
- **URL**: `/admin/registry`
- **Tab**: `Închidere de an`
- **Ce demonstrează**:
  - arhivarea registrelor active din anul selectat (status → `ARCHIVED`)
  - arhivarea lucrărilor anului selectat (status → `ARCHIVED`)
  - generarea automată a Registrului Unic pentru anul următor (dacă nu există)

---

## Endpoint-uri backend (pentru trasabilitate / demo tehnic)
- `GET /api/registry/registers?year=YYYY`
- `POST /api/registry/registers` (SUPER_ADMIN)
- `GET /api/registry/works?unicRegisterId=ID&year=YYYY&search=...`
- `GET /api/registry/works/:workId`
- `POST /api/registry/works` (OPERATOR / MANAGER / DEPARTMENT_ADMIN / SUPER_ADMIN)
- `PUT /api/registry/works/:workId/assign` (repartizare)
- `POST /api/registry/works/:workId/transfer` (circulație internă)
- `POST /api/registry/works/:workId/entries` (adăugare act la lucrare)
- `GET /api/registry/entries?registerId=ID&year=YYYY&search=...`
- `POST /api/registry/registers/:registerId/entries` (OPERATOR / MANAGER / DEPARTMENT_ADMIN / SUPER_ADMIN)
- `PUT /api/registry/entries/:entryId/assign` (repartizare) (OPERATOR / MANAGER / DEPARTMENT_ADMIN / SUPER_ADMIN)
- `POST /api/registry/admin/rollover` (SUPER_ADMIN)
- `POST /api/registry/admin/bootstrap-year` (SUPER_ADMIN) (opțional pentru inițializare rapidă)
- `POST /api/registry/admin/seed-demo` (SUPER_ADMIN) (opțional pentru demo intern)

---

## Notă importantă (DB)
Pentru ca modulul să funcționeze, schema trebuie să conțină tabelele din:
`backend/src/db/migrations/add_registry_module.sql`
și extinderea:
`backend/src/db/migrations/add_registry_works.sql`


