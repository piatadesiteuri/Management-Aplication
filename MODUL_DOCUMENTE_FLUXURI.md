## Modul: Managementul documentelor și fluxurilor – structură oficială (achiziții publice)

### 1. Formularea corectă (de pus în propunerea tehnică)
În propunerea tehnică, modulul se descrie astfel:

**„Soluția implementează un Motor de fluxuri electronice care permite modelarea, execuția și monitorizarea fluxurilor de lucru, de documente și de informații, în conformitate cu principiile guvernanței electronice ale instituțiilor publice.”**

---

### 2. Arhitectura logică (4 componente – obligatoriu de descris)

#### 2.1 Motor de fluxuri electronice (Workflow Engine)
**Responsabilități (conceptual):**
- definirea fluxurilor (șabloane/template-uri + configurații)
- execuția automată (inițiere, avansare, escaladare, închidere)
- monitorizare (progres, status, KPI)
- revenire controlată (rollback de flux, nu ștergere de date)
- versionarea definițiilor de flux

**Implementare în aplicație (astăzi):**
- **Task Workflow Engine**: `task_templates` + `task_workflows` + generare/avansare task-uri
- **Approval Workflow**: inițializare și procesare acțiuni de aprobare pentru cereri/evenimente
- Audit: `activity_logs` + istorice de task-uri

**Demonstrare (UI/URL):**
- `/admin/tasks` (execuție/monitorizare task-uri)
- `/admin/activity-logs` (audit)

**Endpoint-uri (trasabilitate):**
- `GET/POST /api/task-workflows/*`
- `GET/POST /api/approval-workflow/*`
- `GET /api/tasks/*`

#### 2.2 Motor de conținut structurat (Form / Document Engine)
**Responsabilități (conceptual):**
- definire câmpuri și metadate (titlu, tip, număr, emitent/inițiator, destinatar, termen)
- validări
- atașamente + conversie pentru vizualizare
- generare document electronic (extensibil)

**Implementare în aplicație (astăzi):**
- Management documente cu metadate și fișiere (vehicule + evenimente)
- Vizualizare/descărcare + **conversie DOC/DOCX → PDF** pentru vizualizare

**Demonstrare (UI/URL):**
- `/admin/documents` (documente: vehicule/evenimente)

**Endpoint-uri (trasabilitate):**
- `GET /api/documents/vehicles|events`
- `GET /api/documents/*/stats`
- `GET /api/documents/:id/view`, `GET /api/documents/:id/download`
- `GET /api/documents/:id/view-pdf` (conversie)

#### 2.3 Motor de guvernanță (Rules / Context Engine)
**Responsabilități (conceptual):**
- competență materială (tip cerere/proces)
- competență teritorială (județ/zonă)
- structură organizatorică (departamente, ierarhii)
- reguli instituționale (praguri, priorități, SLA)
- încărcare angajați/roluri (mapping rol → permisiuni)

**Implementare în aplicație (astăzi):**
- **Rule Engine** pentru reguli/alerte (evaluare periodică, severitate, acțiuni)
- Context organizațional: `departments`, roluri și autorizări

**Demonstrare (UI/URL):**
- `/admin/alerts` (reguli + alerte + motor)
- `/admin/users` (organizare utilizatori/roluri)

**Endpoint-uri (trasabilitate):**
- `GET/POST/PUT/DELETE /api/alerts/rules`
- `POST /api/alerts/engine/start|stop`
- `POST /api/alerts/trigger-rules`
- `GET /api/departments/*`

#### 2.4 Motor de semnare și arhivare
**Responsabilități (conceptual):**
- semnare calificată
- sigilare calificată
- versionare document (revizii)
- anulare / reluare semnare
- arhivare finală (închidere dosar)

**Implementare în aplicație (astăzi):**
- **Arhivare/gestionare fișiere** (upload, păstrare, view/download, audit)
- **Semnare calificată/sigilare**: **extensibilă** (integrare cu furnizor de semnătură, HSM/servicii externe)

---

### 3. Clasificarea oficială a fluxurilor (3 subcapitole distincte)

#### 3.1 Fluxuri de lucru (Workflow-uri)
**Definiție:** succesiunea de etape și acțiuni pentru finalizarea unui proces administrativ/operational.

**Exemple demonstrate:**
- workflow-uri de task-uri pe evenimente (template → generare task-uri → progres)
- workflow de aprobare (cereri) (inițializare → acțiuni approve/reject → escaladare)

**Caracteristici bifate:**
- inițiator (utilizator)
- etape (task_steps / request actions)
- responsabili (assigned_to)
- statusuri + progres
- audit + istoric

#### 3.2 Fluxuri de documente
**Definiție:** traseul documentelor electronice prin etape de avizare, semnare, înregistrare și arhivare.

**Implementare:**
- documente cu metadate + atașamente + versiuni (extensibil) + conversie vizualizare
- integrare cu semnare/sigilare: extensibilă

#### 3.3 Fluxuri de informații
**Definiție:** circulația informațiilor între sisteme și utilizatori (intern/extern).

**Implementare:**
- notificări + alerte + rule engine (evaluare periodică, generare alerte)
- WebSocket pentru livrare evenimente către UI (notificări)

---

### 4. Modelarea fluxurilor (prezentată ca facilă / low-code)

#### 4.1 Modelare contextuală (declarativă)
Fluxurile sunt **configurate** în funcție de context, nu „hardcodate” în ecrane:
- **Competență materială**: tip eveniment / tip cerere (template-uri distincte)
- **Structură**: departament asociat
- **Rol inițiator**: admin/operator/manager (extensibil pentru PF/PJ)
- **Reguli**: priorități, termene, severitate (rule engine)

#### 4.2 Structura minimă a unui flux (model suportat)
Modelul permite (implementat parțial / extensibil):
- denumire flux
- tip flux (lucru / document / informație)
- proces asociat (competență materială)
- inițiator (salariat; extensibil PF/PJ)
- parcurs instituțional (etape)
- condiționări (reguli)
- reguli de arhivare / închidere

---

### 5. Rollback tranzacțional (formularea corectă)
**Formulare de folosit:**
„Soluția implementează un mecanism de revenire controlată a fluxului într-o stare anterioară stabilă, cu păstrarea istoricului și motivarea explicită a acțiunii, fără afectarea datelor istorice deja înregistrate.”

**Stare actuală (implementare parțială):**
- istoric task-uri + statusuri (PENDING/IN_PROGRESS/COMPLETED/CANCELLED)
- acțiuni de anulare / escaladare în workflow-uri (approval + task)
- păstrare audit în `activity_logs`

---

### 6. Versionarea fluxurilor (formularea corectă)
**Formulare de folosit:**
„Soluția suportă versionarea fluxurilor, fiecare instanță de flux fiind executată conform definiției active la momentul inițierii, fără impact asupra fluxurilor deja lansate sau datelor generate anterior.”

**Stare actuală:**
- template-urile există ca entități (`task_templates`) cu `updated_at` + `is_active`
- versionare explicită (număr versiune) este **extensibilă** (adăugare `version`, `effective_from`, `effective_to`)

---

### 7. Semnare electronică în flux (checklist cerut)
**Model suportat (conceptual), implementare extensibilă:**
- desemnare semnatari + ordine semnare
- motiv semnare
- poziționare semnătură + sigiliu
- versionare document
- anulare semnare + reluare semnare

În MVP, se demonstrează „pachet document + traseu + audit”, iar semnarea calificată se adaugă prin integrare.

---

### 8. Disponibilitate (categorii utilizatori)
**Declarație corectă:**
„Fluxurile predefinite sunt disponibile pentru salariați pe canal online (UI intern) și offline (prin operațiuni de ghișeu), iar pentru PF/PJ sunt extensibile prin canal online (portal) – aceeași arhitectură de fluxuri.”

---

### 9. Matrice onestă „implementat / parțial / extensibil”
| Cerință | Status | Unde se vede |
|---|---|---|
| Workflow engine (execuție/monitorizare) | Implementat | `/admin/tasks`, `/api/task-workflows/*`, `/api/tasks/*` |
| Approval workflow | Implementat (API) / UI parțial | `/api/approval-workflow/*` |
| Document engine (metadate, view/download, conversie) | Implementat | `/admin/documents`, `/api/documents/*` |
| Rules/context engine (reguli + evaluare) | Implementat | `/admin/alerts`, `/api/alerts/*` |
| Rollback controlat (revenire de flux) | Parțial | statusuri + anulare + audit |
| Versionare flux | Extensibil | `task_templates` + strategie de versionare |
| Semnare calificată/sigilare | Extensibil | integrare furnizor semnătură |
| Arhivare finală / dosar logic | Parțial | fișiere + audit; dosar logic complet extins prin Registratură |


