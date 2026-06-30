## Modul Registratură – descriere conformă (model legal + demonstrare în aplicație)

### 0. Scop și context
Acest modul implementează modelul uzual (acceptat în practică) de **registratură publică**, separând clar:
- **LUCRAREA** (dosar logic / unitate de evidență în Registrul Unic)
- **ACTUL** (document individual evidențiat într-un registru de acte)

În aplicație, demonstrarea este făcută prin ecranul `/admin/registry` și endpoint-urile `GET/POST /api/registry/*`, cu audit în `activity_logs`.

---

### 1. Model conceptual (terminologie oficială)

#### 1.1 Entități fundamentale
- **Lucrare**: dosar logic, unitate de evidență în Registrul Unic. Poate avea 1..N acte asociate. Este purtătorul fluxului administrativ (repartizare, circulație internă, finalizare, arhivare).
- **Act**: document individual (intrare/ieșire/intern). Se evidențiază într-un **Registru de acte** (per structură/birou/serviciu).
- **Registrul Unic**: registru instituțional care evidențiază **lucrările** (centralizat), indiferent de canal.
- **Registru de acte**: registru de evidență a **actelor**, cu numerotare distinctă per registru/an, asociabil unuia sau mai multor departamente.
- **Canal de recepție**:
  - **Fizic (ghișeu)**: recepție manuală, digitalizare (scan/atașament), declanșare flux.
  - **Online**: recepție automată (formular/atașamente), declanșare flux.
  - **Intern**: circulație internă, fără ieșire externă.
- **Flux de lucru**: circuit standardizat al unei lucrări și al actelor asociate (recepție → repartizare → circulație internă → expediere/finalizare → arhivare).

#### 1.2 Numerotare (principiu)
- **Registrul Unic (lucrări)**: numerotare unică instituție/an.
  - Exemplu format: **RU-2025-000123**
- **Registre de acte (acte)**: numerotare unică per registru/an.
  - Exemplu format: **ACT-D5-2025-0045** (D5 = identificator structură derivat din codul registrului)

Numerotarea este alocată tranzacțional, cu contor `registry_counters` și `SELECT ... FOR UPDATE`, asigurând unicitate și auditabilitate.

---

### 2. Structura oficială a registraturii (cum se vede în aplicație)

#### 2.1 Registrul Unic (nivel instituție) – **LUCRĂRI**
**Rol**:
- evidență centralizată a tuturor lucrărilor instituției
- numerotare unică instituțională
- include: intrări, ieșiri, interne
- include: canalul (ghișeu / online / intern) și statusul fluxului

**Ce se demonstrează în UI** (`/admin/registry` → tab **Registrul Unic (Lucrări)**):
- listă lucrări (număr RU, tip, canal, status flux, repartizare)
- recepția unei lucrări (ghișeu/online) prin modal „Recepție lucrare”
- detalii lucrare (dosar logic):
  - status și metadate
  - acte asociate
  - istoric de circulație internă (transferuri)
  - acțiuni: repartizare + transfer (auditabile)

#### 2.2 Registre de acte (nivel structură) – **ACTE**
**Rol**:
- evidență a actelor individuale, cu numerotare distinctă pe registru/an
- asociere registru ↔ departamente (una sau mai multe structuri pot utiliza același registru)

**Ce se demonstrează în UI** (`/admin/registry` → tab **Registre de acte (Acte)**):
- existența mai multor registre pe an (dropdown de selecție)
- listă acte în registrul selectat (număr ACT, tip, status, date)
- creare act manuală (ghișeu/online/intern)

---

### 3. Canale: registratură fizică vs online (convergente, dar distincte)

#### 3.1 Registratură fizică digitalizată (ghișeu)
**Concept**:
- operator ghișeu introduce manual datele actului/lucrării
- documentele pot fi scanate și încărcate ca atașament (integrare cu arhiva electronică)

**Demonstrare**:
- recepție cu **Canal recepție = PHYSICAL** (Ghișeu)

#### 3.2 Registratură online automatizată
**Concept**:
- formular online + atașamente
- înregistrare automată
- flux preconfigurat

**Demonstrare**:
- recepție cu **Canal recepție = ONLINE**
- (extensibil) endpoint/pagină „simulare intrare online” sau integrare portal public

---

### 4. Fluxurile obligatorii (cerință critică)

#### 4.1 Recepția actelor (înregistrare inițială)
**Obligatoriu**:
- creare lucrare (Registrul Unic) + act inițial (registru de acte)
- numerotare automată
- status inițial: **RECEIVED**

**Demonstrare**:
- modal „Recepție lucrare + act” (crează LUCRARE + ACT asociat)

#### 4.2 Repartizarea
**Obligatoriu**:
- atribuire către structură/persoană
- status: **ASSIGNED**
- audit: cine/când

**Demonstrare**:
- în „Detalii lucrare” → acțiune „Repartizează” (select structură)

#### 4.3 Circulația internă
**Obligatoriu**:
- transfer între structuri
- istoric traseu
- fără ieșire externă

**Demonstrare**:
- „Detalii lucrare” → secțiune „Circulație internă (transfer)” + listă „Istoric circulație”

#### 4.4 Expedierea / finalizarea
**Obligatoriu**:
- ieșire externă (pentru lucrări OUT)
- document generat/atașat
- închidere/finalizare flux

**Demonstrare**:
- statusurile sunt mapate în UI ca „Status flux” și pot fi extinse cu acțiuni dedicate (SENT/FINALIZED).

---

### 5. Multianualitate și închidere de an (proces, nu buton)

#### 5.1 Ce face sistemul automat
La rularea „închiderii de an”:
- arhivează registrele active din anul curent (status register → **ARCHIVED**)
- arhivează lucrările din anul curent (status work → **ARCHIVED**)
- creează Registrul Unic pentru anul următor (dacă nu există)
- păstrează istoricul și numerotările (contor per registru/an)

**Demonstrare**:
- `/admin/registry` → tab **Închidere de an**
- audit în `activity_logs` (acțiune de sistem)

---

### 6. Integrarea cu arhiva electronică (conceptual + extensibil)
Modelul susține:
- **fiecare act** ↔ document(e) în arhivă (`registry_documents`)
- **fiecare lucrare** ↔ dosar logic (work) care grupează actele și metadatele
- arhiva păstrează: fișiere, metadate, versiuni, audit

Chiar dacă unele componente sunt „mock” în MVP, integrarea este proiectată explicit (tabele + endpoint-uri + UI hooks).

---

### 7. Trasabilitate / audit (criteriu achiziții publice)
Toate acțiunile cheie sunt logate:
- creare registru / bootstrap
- recepție lucrare
- creare act + asociere la lucrare
- repartizare
- transfer (circulație internă)
- închidere de an

---

### 8. Corespondență „cerință → unde se vede” (rezumat)
Vezi documentul `REGISTRATURA_CERINTA_ECRAN.md`.


