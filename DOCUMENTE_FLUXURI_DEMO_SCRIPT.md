## Modul 2 – Script demo (evaluare): management documente și fluxuri

### Precondiții
- Autentificare cu utilizator ADMIN/SUPER_ADMIN
- Navigare în aplicație pe rutele de admin

---

### Pasul 1 – Demonstrare Document Engine (2 minute)
1. Deschide: **`/admin/documents`**
2. Arată:
   - tab documente vehicule / tab documente evenimente
   - metadate listate (titlu/tip/număr, date, uploader etc. – în funcție de tab)
3. Demonstrează:
   - **vizualizare** document: `View` (backend servește inline)
   - **descărcare** document: `Download`
   - **conversie DOC/DOCX → PDF pentru view** (dacă există docx în demo): endpoint `view-pdf`

Ce explici comisiei:
- „Motorul de conținut gestionează metadate + fișiere + conversie pentru vizualizare, asigurând un mod unitar de consultare.”

---

### Pasul 2 – Demonstrare Workflow Engine (Task workflows) (2–3 minute)
1. Deschide: **`/admin/tasks`**
2. Arată:
   - statusuri task (PENDING/IN_PROGRESS/COMPLETED/CANCELLED)
   - istoricul task-urilor (audit intern)
3. (Opțional) Demonstrare API pentru template-uri (dacă e nevoie în demo tehnic):
   - `GET /api/task-workflows/templates`
   - `POST /api/task-workflows/generate-tasks` (generează task-uri pentru un eveniment)

Ce explici:
- „Acesta este motorul de fluxuri: definește etape (task_steps), execută automat (generare/avansare), monitorizează progresul și păstrează istoric.”

---

### Pasul 3 – Demonstrare Rules/Context Engine (2 minute)
1. Deschide: **`/admin/alerts`**
2. Arată:
   - reguli (create/update/delete)
   - severitate și condiții
3. Demonstrează (dacă e activ):
   - pornire/opririe motor: `POST /api/alerts/engine/start|stop`
   - rulare manuală: `POST /api/alerts/trigger-rules`

Ce explici:
- „Regulile sunt declarative; engine-ul le evaluează periodic și generează alerte/notificări – flux de informații.”

---

### Pasul 4 – Demonstrare audit / trasabilitate (1 minut)
1. Deschide: **`/admin/activity-logs`**
2. Arată că acțiunile importante (fluxuri, documente, reguli) sunt logate

Ce explici:
- „Monitorizarea și auditul sunt componente obligatorii în guvernanța electronică.”

---

### Declarație onestă (de spus explicit)
- Semnare calificată / sigilare calificată: **extensibilă** (integrare furnizor)
- Versionare explicită flux: **extensibilă** (strategie pe template-uri)
- Rollback: **revenire controlată de flux**, fără ștergere de date istorice (audit + motivare)


