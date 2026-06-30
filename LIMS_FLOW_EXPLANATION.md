# LIMS - Flow Complet și Explicații

## 📋 Structura Testelor în Sistem

### De unde vin testele?

Testele sunt **stocate în baza de date** în tabelul `laboratory_tests` și sunt organizate pe **categorii** (`test_categories`).

### Structura unui test:

```sql
laboratory_tests:
- id: Identificator unic
- category_id: Categoria din care face parte (Hematologie, Biochimie, etc.)
- name: Numele complet al testului (ex: "Hemogramă completă")
- code: Cod unic al testului (ex: "HEM_CBC")
- description: Descrierea testului
- sample_type: Tipul de probă necesar (SANGE, URINA, SPUTA, etc.)
- unit: Unitatea de măsură (mg/dL, U/L, %, etc.)
- normal_values: Valorile normale de referință
- estimated_duration_hours: Durata estimată pentru rezultat
- is_active: Dacă testul este activ și disponibil
```

### Categorii de teste disponibile:

1. **Hematologie (HEM)** - Analize de sânge
   - Hemogramă completă
   - VSH
   - Leucocite, Hemoglobină, Hematocrit, Plaquete

2. **Biochimie (BIO)** - Analize biochimice
   - Glicemie
   - Creatinină, Uree
   - Colesterol, Trigliceride
   - Transaminaze (ALT, AST)
   - Bilirubină, PCR, HbA1c

3. **Microbiologie (MICRO)** - Analize microbiologice
   - Cultura bacteriologică
   - Antibiogramă
   - Examen direct

4. **Coagulare (COAG)** - Teste de coagulare
   - Timp de protrombină (PT)
   - INR
   - aPTT

5. **Imunologie (IMMUN)** - Analize imunologice
   - Test COVID-19 (PCR)
   - Test COVID-19 (Antigen rapid)

## 🔄 Flow Complet LIMS

### 1. Înregistrare Cerere de Analize

**Pas 1:** Utilizatorul deschide modulul "LIMS - Management Probe" și apasă "Adaugă Cerere"

**Pas 2:** Căutare pacient
- Se caută în baza de date `patients` după:
  - Nume (first_name, last_name)
  - CNP (identity_number)
- Dacă pacientul există → se selectează
- Dacă nu există → se poate adăuga pacient nou

**Pas 3:** Verificare date pacient
- Se verifică datele personale ale pacientului
- Se poate actualiza dacă este nevoie (buton dedicat)

**Pas 4:** Selectare laborator și medici
- Se alege laboratorul din lista `laboratories`
- Se selectează medicul responsabil de laborator (din `laboratory_doctors`)
- Opțional: medicul trimițător
- Se completează diagnosticul și observațiile

**Pas 5:** Selectare teste
- Testele sunt **preluate din baza de date** (`laboratory_tests`)
- Se pot filtra pe categorii sau căuta după nume/cod
- Fiecare test afișează:
  - Numele complet
  - Codul testului
  - Tipul de probă necesar (SANGE, URINA, etc.)
- Se selectează testele dorite și se apasă "Adaugă"
- Testele selectate sunt asociate cu cererea în `analysis_request_tests`

**Pas 6:** Salvare cerere
- Se generează automat numărul cererii (format: CER-YYYY-NNNNNN)
- Se salvează în `analysis_requests` cu status DRAFT
- Se salvează testele asociate în `analysis_request_tests`
- Se alege tipul de recepție:
  - WITH_RECEPTION: Cu recepție
  - WITH_LABELING: Cu recepție și etichetare
  - WITHOUT_RECEPTION: Fără recepție (va apărea în Recepție Probe)

**Pas 7:** Verificare
- Cererea apare în tab-ul "Cereri de Analize"
- Se poate vizualiza detaliat (pacient, laborator, teste, status)

### 2. Recepție Probe

**Pas 1:** Se deschide tab-ul "Recepție Probe"
- Se afișează cererile cu status DRAFT și reception_type = WITHOUT_RECEPTION

**Pas 2:** Se apasă "Recepție Probă" pentru o cerere
- Se deschide modal cu lista de teste din cerere
- Se selectează probele care au fost recepționate (checkbox-uri)

**Pas 3:** Salvare recepție
- Se actualizează `analysis_request_tests` → status = IN_PROGRESS
- Se actualizează `analysis_requests` → status = RECEIVED, reception_date = NOW()
- Cererea **dispare din Recepție Probe** și apare în **Lista de Lucru**

### 3. Înregistrare Rezultate Teste

**Pas 1:** Se deschide tab-ul "Lista de Lucru"
- Se afișează cererile cu status RECEIVED sau IN_PROGRESS

**Pas 2:** Se apasă "Introducere Rezultate" pentru o cerere
- Se deschide modal cu toate testele din cerere
- Pentru fiecare test se completează:
  - **Rezultat**: Valoarea numerică sau text
  - **Unitate**: Se afișează automat din definiția testului
  - **Detalii/Observații**: Note suplimentare despre test

**Pas 3:** Pentru teste compuse (protocol)
- Dacă testul este un protocol, se apasă "Completează Rezultat Test"
- Se deschide fereastră nouă cu sub-testele componente
- Se introduc rezultatele pentru fiecare sub-test

**Pas 4:** Salvare rezultate
- Se actualizează `analysis_request_tests`:
  - result_value = valoarea introdusă
  - result_unit = unitatea
  - notes = observațiile
  - status = COMPLETED
  - completed_at = NOW()
  - completed_by = utilizatorul curent
- Dacă toate testele sunt completate → `analysis_requests` → status = COMPLETED
- Cererea **dispare din Lista de Lucru** și apare în **Finalizate/Aprobate**

### 4. Aprobare Rezultate

**Pas 1:** Se deschide tab-ul "Finalizate/Aprobate"
- Se afișează cererile cu status COMPLETED

**Pas 2:** Se apasă "Aprobare Rezultate Teste"
- Se confirmă aprobarea (dialog de confirmare)
- Se actualizează cererea (poate fi marcată ca aprobată)

**Pas 3:** Verificare
- Cererea aprobată apare în secțiunea "Aprobate"

### 5. Invalidare Rezultat

**Pas 1:** În tab-ul "Finalizate/Aprobate"
- Se identifică cererea cu rezultate eronate

**Pas 2:** Se apasă "Întoarcere Teste în Lista de Lucru"
- Se confirmă invalidarea
- Se resetează rezultatele în `analysis_request_tests`:
  - result_value = NULL
  - result_unit = NULL
  - status = IN_PROGRESS
- Se actualizează `analysis_requests` → status = RECEIVED
- Cererea **reapare în Lista de Lucru**

### 6. Tipărire Buletin de Analize

**Pas 1:** În tab-ul "Cereri de Analize"
- Se identifică cererea aprobată

**Pas 2:** Se apasă "Tipărire Buletin de Analize"
- Se generează buletinul cu:
  - Datele pacientului
  - Datele cererii
  - Toate testele cu rezultatele lor
  - Valorile normale de referință
  - Data și semnătura

**Pas 3:** Se apasă "Imprimă"
- Se descarcă PDF-ul buletinului

## 📊 Structura Bazei de Date

```
test_categories (Categorii)
    ↓
laboratory_tests (Teste disponibile)
    ↓
analysis_requests (Cereri de analize)
    ↓
analysis_request_tests (Teste asociate cu cererea + rezultate)
```

## 🔍 Cum sunt preluate testele?

1. **La crearea cererii:**
   - Frontend-ul face request: `GET /api/lims/tests`
   - Backend-ul interoghează: `SELECT * FROM laboratory_tests WHERE is_active = TRUE`
   - Se pot filtra pe categorie: `GET /api/lims/tests?category_id=X`
   - Se pot căuta: `GET /api/lims/tests?search=hemograma`

2. **La salvare cerere:**
   - Se trimit ID-urile testelor selectate: `test_ids: [1, 2, 3]`
   - Backend-ul inserează în `analysis_request_tests`:
     ```sql
     INSERT INTO analysis_request_tests (request_id, test_id, priority, status)
     VALUES (requestId, testId, 'NORMAL', 'PENDING')
     ```

3. **La afișare cerere:**
   - Se face JOIN între `analysis_requests` și `analysis_request_tests`
   - Se preiau detaliile testelor din `laboratory_tests`
   - Se afișează: nume, cod, tip probă, rezultate (dacă există)

## ✅ Verificare Flow Complet

Pentru demonstrație video, totul este pregătit:

✅ **Pacienți:** 7 pacienți demo în baza de date
✅ **Laboratoare:** 1 laborator activ
✅ **Medici:** 2 medici de laborator
✅ **Teste:** 20+ teste disponibile pe categorii
✅ **Cereri demo:** 2 cereri (una DRAFT, una RECEIVED)

Tot flow-ul funcționează end-to-end! 🎉
