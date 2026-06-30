## Script demo (evaluare) – Modul Registratură

### Precondiții (2 minute)
- Autentificare cu utilizator cu rol **SUPER_ADMIN** (sau ADMIN mapat la SUPER_ADMIN).
- Navigare: **`/admin/registry`**.
- Selectează anul curent din dropdown (dreapta sus).

---

### Pasul 1 – Inițializare registre (30 sec)
1. Tab **Parametrizare registre**
2. Click **„Generează registre standard”**
3. Confirmare: în listă există:
   - **Registrul Unic** (ACTIVE)
   - Mai multe **Registre de acte** (ACTIVE)

Ce explici comisiei:
- „Sistemul poate configura registrele multianual; registrele de acte sunt per structură și asociate departamentelor.”

---

### Pasul 2 – Recepție lucrare (ghișeu) (1 minut)
1. Tab **Registrul Unic (Lucrări)**
2. Click **„Recepție lucrare (ghișeu/online)”**
3. Completează:
   - Registru de acte: (ex: „Administrativ”)
   - Tip: **Intrare**
   - Canal: **Ghișeu (PHYSICAL)**
   - Titlu: „Cerere depusă la ghișeu – solicitare informații”
   - Expeditor/Destinatar
4. Click **„Recepționează”**

Ce explici:
- „Recepția creează o **LUCRARE** în Registrul Unic cu număr RU unic/an și un **ACT** în registrul de acte selectat, legat de lucrare.”

---

### Pasul 3 – Repartizare (1 minut)
1. Click pe rândul lucrării din listă (se deschide „Detalii lucrare”)
2. Secțiunea **Repartizare**:
   - Alege structura (departament)
   - Click **„Repartizează”**

Ce explici:
- „Flux standard: RECEIVED → ASSIGNED, cu audit (cine/când).”

---

### Pasul 4 – Circulație internă (transfer) (1 minut)
1. În același ecran „Detalii lucrare”
2. Secțiunea **Circulație internă (transfer)**:
   - Selectează alt departament
   - Notă transfer
   - Click **„Înregistrează transfer”**
3. Observi în secțiunea **Istoric circulație (traseu)** înregistrarea transferului

Ce explici:
- „Sistemul păstrează traseul lucrării (istoric), conform cerinței de circulație internă.”

---

### Pasul 5 – Acte asociate (30 sec)
1. În „Detalii lucrare” → click **„Adaugă act”**
2. Creează un act suplimentar (ex: notă internă, canal intern)
3. Observi actul în lista **Acte asociate**

Ce explici:
- „Lucrarea (dosar logic) poate grupa mai multe acte, cu numerotări distincte pe registre.”

---

### Pasul 6 – Închidere de an (1 minut)
1. Tab **Închidere de an**
2. Click **„Rulează închidere de an (YYYY → YYYY+1)”**
3. Confirmări (explicare):
   - registrele anului curent devin **ARCHIVED**
   - lucrările anului curent devin **ARCHIVED**
   - se generează Registrul Unic pentru anul următor (dacă lipsește)

Ce explici:
- „Nu este un buton demo; este un proces cu efecte clare, multianual, auditabil.”


