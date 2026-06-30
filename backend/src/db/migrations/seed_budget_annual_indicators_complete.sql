-- Seed COMPLET pentru "Buget anual" - Venituri și Cheltuieli
-- Include TOATE indicatorii conform documentului PDF oficial "BUGETUL PE ANUL 2025"
-- Idempotent: ON DUPLICATE KEY UPDATE.

INSERT INTO budget_indicators
  (indicator_type, capitol, subcapitol, paragraf, indicator_code, name, ca_cb, row_kind, calc_expression, indent_level, display_order, is_active)
VALUES
  -- ============================================
  -- VENITURI PROPRII (REVENUE)
  -- ============================================
  
  -- VENITURI PROPRII (Capitol 0001, Subcap 10)
  ('REVENUE', '0001', '10', NULL, '0001', 'VENITURI PROPRII', NULL, 'TITLE', NULL, 0, 100, TRUE),
  
  -- 1. VENITURI CURENTE (Capitol 0002, Subcap 10)
  ('REVENUE', '0002', '10', NULL, '0002', '1. VENITURI CURENTE', NULL, 'GROUP', NULL, 1, 200, TRUE),
  
  -- A. VENITURI FISCALE (Capitol 0003)
  ('REVENUE', '0003', NULL, NULL, '0003', 'A. VENITURI FISCALE', NULL, 'GROUP', NULL, 2, 300, TRUE),
  
  -- A4. IMPOZITE SI TAXE PE BUNURI SI SERVICII (Capitol 0004)
  ('REVENUE', '0004', NULL, NULL, '0004', 'A4. IMPOZITE SI TAXE PE BUNURI SI SERVICII', NULL, 'GROUP', NULL, 3, 310, TRUE),
  ('REVENUE', '1210', NULL, NULL, '1210', 'ALTE IMPOZITE SI TAXE GENERALE PE BUNURI SI SERVICII', NULL, 'LEAF', NULL, 4, 311, TRUE),
  ('REVENUE', '1410', NULL, NULL, '1410', 'ACCIZE', NULL, 'LEAF', NULL, 4, 312, TRUE),
  ('REVENUE', '1610', NULL, NULL, '1610', 'Taxe pentru utiliz bun.,autoriz utiliz bun sau pe desfasurarea pe activit(publicitate)', NULL, 'LEAF', NULL, 4, 313, TRUE),
  
  -- C. VENITURI NEFISCALE (Capitol 2900, Subcap 10)
  ('REVENUE', '2900', '10', NULL, '2900', 'C. VENITURI NEFISCALE', NULL, 'GROUP', NULL, 2, 400, TRUE),
  ('REVENUE', '3110', NULL, NULL, '3110', 'VENITURI DIN PROPRIETATE(DOBANZI)', NULL, 'LEAF', NULL, 3, 410, TRUE),
  ('REVENUE', '3310', NULL, NULL, '3310', 'VENITURI DIN PRESTARI DE SERVICII', NULL, 'LEAF', NULL, 3, 420, TRUE),
  ('REVENUE', '3610', NULL, NULL, '3610', 'DIVERSE VENITURI', NULL, 'LEAF', NULL, 3, 430, TRUE),
  ('REVENUE', NULL, '50', NULL, '50', 'Alte venituri', NULL, 'LEAF', NULL, 3, 440, TRUE),
  
  -- TRANSFERURI VOLUNTARE ALTELE DECAT SUBV (Capitol 3710)
  ('REVENUE', '3710', NULL, NULL, '3710', 'TRANSFERURI VOLUNTARE ALTELE DECAT SUBV', NULL, 'GROUP', NULL, 2, 500, TRUE),
  ('REVENUE', '3710', NULL, '01', '3710.01', 'Donatii si sponsorizari', NULL, 'LEAF', NULL, 3, 510, TRUE),
  
  -- 3. OPERATIUNI FINANCIARE (Capitol 4010)
  ('REVENUE', '4010', NULL, NULL, '4010', '3. OPERATIUNI FINANCIARE', NULL, 'GROUP', NULL, 1, 600, TRUE),
  
  -- Venituri proprii redistrib (Capitol 4110, Subcap 07)
  ('REVENUE', '4110', '07', NULL, '4110', 'Venituri proprii redistrib intre instit pub fin integral/partial din venituri proprii sau intre activ fin integr din venituri proprii', NULL, 'LEAF', NULL, 2, 700, TRUE),
  
  -- VENITURI PROPRII-TOTAL CHELTUIELI (Capitol 5010)
  ('REVENUE', '5010', NULL, NULL, '5010', 'VENITURI PROPRII-TOTAL CHELTUIELI', NULL, 'TITLE', NULL, 0, 800, TRUE),
  
  -- SANATATE (Capitol 6610)
  ('REVENUE', '6610', NULL, NULL, '6610', 'SANATATE', NULL, 'TITLE', NULL, 0, 900, TRUE),
  
  -- CHELTUIELI CURENTE (Capitol 6610) - pentru venituri proprii
  ('REVENUE', '6610', NULL, NULL, '6610', 'CHELTUIELI CURENTE', NULL, 'GROUP', NULL, 1, 950, TRUE),
  
  -- ============================================
  -- CHELTUIELI (EXPENSE) - Buget de Stat
  -- ============================================
  
  -- CHELTUIELI CURENTE (Capitol 01)
  ('EXPENSE', '01', NULL, NULL, '01', 'CHELTUIELI CURENTE', NULL, 'GROUP', '10+20+30+40+50+51+55+57+59', 0, 1000, TRUE),
  ('EXPENSE', '01', '10', NULL, '01.10', 'CHELTUIELI CURENTE', NULL, 'GROUP', NULL, 1, 1010, TRUE),
  
  -- TITLUL I CHELTUIELI DE PERSONAL (Subcap 10)
  ('EXPENSE', NULL, '10', NULL, '10', 'TITLUL I CHELTUIELI DE PERSONAL', NULL, 'GROUP', '10.01+10.02+10.03', 1, 2000, TRUE),
  
  -- Cheltuieli salariale in bani (Subcap 10, Paragraf 01)
  ('EXPENSE', NULL, '10', '01', '10.01', 'Cheltuieli salariale in bani', NULL, 'GROUP', NULL, 2, 2100, TRUE),
  ('EXPENSE', NULL, '10', '01', '10.01.01', 'Salarii de bază', NULL, 'LEAF', NULL, 3, 2111, TRUE),
  ('EXPENSE', NULL, '10', '02', '10.01.02', 'Salarii de merit', NULL, 'LEAF', NULL, 3, 2120, TRUE),
  ('EXPENSE', NULL, '10', '03', '10.01.03', 'Indemnizații de conducere', NULL, 'LEAF', NULL, 3, 2130, TRUE),
  ('EXPENSE', NULL, '10', '04', '10.01.04', 'Spor de vechime', NULL, 'LEAF', NULL, 3, 2140, TRUE),
  ('EXPENSE', NULL, '10', '05', '10.01.05', 'Sporuri pentru condiții de muncă', NULL, 'LEAF', NULL, 3, 2150, TRUE),
  ('EXPENSE', NULL, '10', '06', '10.01.06', 'Alte sporuri', NULL, 'LEAF', NULL, 3, 2160, TRUE),
  ('EXPENSE', NULL, '10', '07', '10.01.07', 'Ore suplimentare', NULL, 'LEAF', NULL, 3, 2170, TRUE),
  ('EXPENSE', NULL, '10', '08', '10.01.08', 'Fond de premii', NULL, 'LEAF', NULL, 3, 2180, TRUE),
  ('EXPENSE', NULL, '10', '09', '10.01.09', 'Prima de vacanță', NULL, 'LEAF', NULL, 3, 2190, TRUE),
  ('EXPENSE', NULL, '10', '10', '10.01.10', 'Fond pentru posturi ocupate prin cumul', NULL, 'LEAF', NULL, 3, 2200, TRUE),
  ('EXPENSE', NULL, '10', '11', '10.01.11', 'Fond aferent plății cu ora', NULL, 'LEAF', NULL, 3, 2210, TRUE),
  ('EXPENSE', NULL, '10', '12', '10.01.12', 'Indemnizații plătite unor persoane din afara unitații', NULL, 'LEAF', NULL, 3, 2220, TRUE),
  ('EXPENSE', NULL, '10', '13', '10.01.13', 'Indemnizații de delegare', NULL, 'LEAF', NULL, 3, 2230, TRUE),
  ('EXPENSE', NULL, '10', '14', '10.01.14', 'Indemnizații de detasare', NULL, 'LEAF', NULL, 3, 2240, TRUE),
  ('EXPENSE', NULL, '10', '17', '10.01.17', 'Indemnizații de hrana', NULL, 'LEAF', NULL, 3, 2250, TRUE),
  ('EXPENSE', NULL, '10', '29', '10.01.29', 'Stimulente de risc', NULL, 'LEAF', NULL, 3, 2260, TRUE),
  ('EXPENSE', NULL, '10', '30', '10.01.30', 'Alte drepturi salariale in bani', NULL, 'LEAF', NULL, 3, 2270, TRUE),
  
  -- Cheltuieli salariale in natura (Subcap 10, Paragraf 02)
  ('EXPENSE', NULL, '10', '02', '10.02', 'Cheltuieli salariale in natura', NULL, 'GROUP', NULL, 2, 2300, TRUE),
  ('EXPENSE', NULL, '10', '60', '10.02.60', 'Vouchere de vacanta', NULL, 'LEAF', NULL, 3, 2360, TRUE),
  
  -- Contribuții (Subcap 03)
  ('EXPENSE', NULL, '03', NULL, '10.03', 'Contribuții', NULL, 'GROUP', NULL, 2, 3000, TRUE),
  ('EXPENSE', NULL, '03', '01', '10.03.01', 'Contribuții pentru asigurări sociale de stat', NULL, 'LEAF', NULL, 3, 3011, TRUE),
  ('EXPENSE', NULL, '03', '02', '10.03.02', 'Contribuții pentru asigurările de șomaj', NULL, 'LEAF', NULL, 3, 3020, TRUE),
  ('EXPENSE', NULL, '03', '03', '10.03.03', 'Contribuții pentru asigurările sociale de sănătate', NULL, 'LEAF', NULL, 3, 3030, TRUE),
  ('EXPENSE', NULL, '03', '04', '10.03.04', 'Contribuții de asigurari pt accidente de munca si boli profes.', NULL, 'LEAF', NULL, 3, 3040, TRUE),
  ('EXPENSE', NULL, '03', '06', '10.03.06', 'Contribuții pentru concedii si indemnizații', NULL, 'LEAF', NULL, 3, 3050, TRUE),
  ('EXPENSE', NULL, '03', '07', '10.03.07', 'Contribuții la Fondul de garantare a creanțelor salariale', NULL, 'LEAF', NULL, 3, 3060, TRUE),
  ('EXPENSE', NULL, '20', NULL, '10.03.20', 'Contributie asiguratorie pentru munca', NULL, 'LEAF', NULL, 3, 3200, TRUE),
  
  -- TITLUL II BUNURI ȘI SERVICII (Subcap 20)
  ('EXPENSE', NULL, '20', NULL, '20', 'TITLUL II BUNURI ȘI SERVICII', NULL, 'GROUP', NULL, 1, 4000, TRUE),
  
  -- Bunuri și servicii (Subcap 20, Paragraf 01)
  ('EXPENSE', NULL, '20', '01', '20.01', 'Bunuri și servicii', NULL, 'GROUP', NULL, 2, 4100, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.01', 'Furnituri de birou', NULL, 'LEAF', NULL, 3, 4111, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.02', 'Materiale pentru curățenie', NULL, 'LEAF', NULL, 3, 4120, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.03', 'Iluminat, incălzit și forță motrică', NULL, 'LEAF', NULL, 3, 4130, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.04', 'Apă, canal si salubritate', NULL, 'LEAF', NULL, 3, 4140, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.05', 'Carburanți si lubrifianți', NULL, 'LEAF', NULL, 3, 4150, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.06', 'Piese de schimb', NULL, 'LEAF', NULL, 3, 4160, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.07', 'Transport', NULL, 'LEAF', NULL, 3, 4170, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.08', 'Poștă, telecomunicatii, radio, tv, internet', NULL, 'LEAF', NULL, 3, 4180, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.09', 'Materiale si prestări de servicii cu caracter funcțional', NULL, 'LEAF', NULL, 3, 4190, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.30', 'Alte bunuri și servicii pentru întreținere si funcționare', NULL, 'LEAF', NULL, 3, 4200, TRUE),
  
  -- Reparații curente (Subcap 20, Paragraf 02)
  ('EXPENSE', NULL, '20', '02', '20.02', 'Reparații curente', NULL, 'LEAF', NULL, 2, 4300, TRUE),
  
  -- Hrană (Subcap 20, Paragraf 03)
  ('EXPENSE', NULL, '20', '03', '20.03', 'Hrană', NULL, 'GROUP', NULL, 2, 4400, TRUE),
  ('EXPENSE', NULL, '20', '03', '20.03.01', 'Hrană pentru oameni', NULL, 'LEAF', NULL, 3, 4411, TRUE),
  ('EXPENSE', NULL, '20', '03', '20.03.02', 'Hrană pentru animale', NULL, 'LEAF', NULL, 3, 4420, TRUE),
  
  -- Medicamente și materiale sanitare (Subcap 20, Paragraf 04)
  ('EXPENSE', NULL, '20', '04', '20.04', 'Medicamente și materiale sanitare', NULL, 'GROUP', NULL, 2, 4500, TRUE),
  ('EXPENSE', NULL, '20', '04', '20.04.01', 'Medicamente', NULL, 'LEAF', NULL, 3, 4511, TRUE),
  ('EXPENSE', NULL, '20', '04', '20.04.02', 'Materiale sanitare', NULL, 'LEAF', NULL, 3, 4520, TRUE),
  ('EXPENSE', NULL, '20', '04', '20.04.03', 'Reactivi', NULL, 'LEAF', NULL, 3, 4530, TRUE),
  ('EXPENSE', NULL, '20', '04', '20.04.04', 'Dezinfectanți', NULL, 'LEAF', NULL, 3, 4540, TRUE),
  
  -- Bunuri de natura obiectelor de inventar (Subcap 20, Paragraf 05)
  ('EXPENSE', NULL, '20', '05', '20.05', 'Bunuri de natura obiectelor de inventar', NULL, 'GROUP', NULL, 2, 4600, TRUE),
  ('EXPENSE', NULL, '20', '05', '20.05.01', 'Uniforme si echipament', NULL, 'LEAF', NULL, 3, 4611, TRUE),
  ('EXPENSE', NULL, '20', '05', '20.05.03', 'Lenjerie si accesorii de pat', NULL, 'LEAF', NULL, 3, 4620, TRUE),
  ('EXPENSE', NULL, '20', '05', '20.05.30', 'Alte obiecte de inventar', NULL, 'LEAF', NULL, 3, 4630, TRUE),
  
  -- Deplasări, detașări, transferări (Subcap 20, Paragraf 06)
  ('EXPENSE', NULL, '20', '06', '20.06', 'Deplasări, detașări, transferări', NULL, 'GROUP', NULL, 2, 4700, TRUE),
  ('EXPENSE', NULL, '20', '06', '20.06.01', 'Deplasări interne, detașări, transferări', NULL, 'LEAF', NULL, 3, 4711, TRUE),
  
  -- Materiale de laborator (Subcap 20, Paragraf 09)
  ('EXPENSE', NULL, '20', '09', '20.09', 'Materiale de laborator', NULL, 'LEAF', NULL, 2, 4800, TRUE),
  
  -- Cărți, publicații si materiale documentare (Subcap 20, Paragraf 11)
  ('EXPENSE', NULL, '20', '11', '20.11', 'Cărți, publicații si materiale documentare', NULL, 'LEAF', NULL, 2, 4900, TRUE),
  
  -- Consultanta si expertiza (Subcap 20, Paragraf 12)
  ('EXPENSE', NULL, '20', '12', '20.12', 'Consultanta si expertiza', NULL, 'LEAF', NULL, 2, 5000, TRUE),
  
  -- Pregatire profesională (Subcap 20, Paragraf 13)
  ('EXPENSE', NULL, '20', '13', '20.13', 'Pregatire profesională', NULL, 'LEAF', NULL, 2, 5100, TRUE),
  
  -- Protecția muncii (Subcap 20, Paragraf 14)
  ('EXPENSE', NULL, '20', '14', '20.14', 'Protecția muncii', NULL, 'LEAF', NULL, 2, 5200, TRUE),
  
  -- Chelt judiciare si extrajudic (Subcap 20, Paragraf 25)
  ('EXPENSE', NULL, '20', '25', '20.25', 'Chelt judiciare si extrajudic deriv din act in reprez inter stat', NULL, 'LEAF', NULL, 2, 5250, TRUE),
  
  -- Alte cheltuieli (Subcap 20, Paragraf 30)
  ('EXPENSE', NULL, '20', '30', '20.30', 'Alte cheltuieli', NULL, 'LEAF', NULL, 2, 5300, TRUE),
  ('EXPENSE', NULL, '20', '30', '20.30.02', 'Protocol si reprezentare', NULL, 'LEAF', NULL, 3, 5302, TRUE),
  ('EXPENSE', NULL, '20', '30', '20.30.04', 'Chirii', NULL, 'LEAF', NULL, 3, 5320, TRUE),
  ('EXPENSE', NULL, '20', '30', '20.30.09', 'Executare silita a creantelor bugetare', NULL, 'LEAF', NULL, 3, 5330, TRUE),
  ('EXPENSE', NULL, '20', '30', '20.30.30', 'Alte cheltuieli cu bunuri și servicii', NULL, 'LEAF', NULL, 3, 5340, TRUE),
  
  -- Finantare din venituri proprii (Subcap 20, Paragraf 31, 32, 33, 34, 35, 37)
  ('EXPENSE', NULL, '20', '31', '20.31', 'Finantarea unor act de sanat din unit sanit de la AAPL', NULL, 'LEAF', NULL, 2, 5400, TRUE),
  ('EXPENSE', NULL, '20', '32', '20.32', 'Finantarea PNS derulate de unit sanit de la AAPL', NULL, 'LEAF', NULL, 2, 5500, TRUE),
  ('EXPENSE', NULL, '20', '33', '20.33', 'Finantarea asist med desf in cab med din unit de invat', NULL, 'LEAF', NULL, 2, 5600, TRUE),
  ('EXPENSE', NULL, '20', '34', '20.34', 'Fin din venituri proprii ale MS pt act de san din cadrul unit san din reteaua admin publ locale', NULL, 'LEAF', NULL, 2, 5700, TRUE),
  ('EXPENSE', NULL, '20', '35', '20.35', 'Finantarea din venituri proprii ale MS pt PNS derulate de unit sanit de la AAPL', NULL, 'LEAF', NULL, 2, 5800, TRUE),
  ('EXPENSE', NULL, '20', '37', '20.37', 'Finantarea stimulentului de risc pt pers unit san din reteaua adm publ locale', NULL, 'LEAF', NULL, 2, 5900, TRUE),
  
  -- TITLUL VI TRANSFERURI INTRE UNITATI ALE ADM PUBLICE (Subcap 51)
  ('EXPENSE', NULL, '51', NULL, '51', 'TITLUL VI TRANSFERURI INTRE UNITATI ALE ADM PUBLICE', NULL, 'GROUP', NULL, 1, 6000, TRUE),
  ('EXPENSE', NULL, '51', '01', '51.01', 'Transferuri curente', NULL, 'GROUP', NULL, 2, 6100, TRUE),
  ('EXPENSE', NULL, '51', '01', '51.01.01', 'Transferuri catre institutii publice', NULL, 'LEAF', NULL, 3, 6101, TRUE),
  ('EXPENSE', NULL, '51', '01', '51.01.03', 'Actiuni de sanatate', NULL, 'LEAF', NULL, 3, 6110, TRUE),
  ('EXPENSE', NULL, '51', '01', '51.01.11', 'Transferuri din bugetul de stat catre bugetul FNUASS', NULL, 'LEAF', NULL, 3, 6111, TRUE),
  ('EXPENSE', NULL, '51', '01', '51.01.25', 'Programe pt sanatate', NULL, 'LEAF', NULL, 3, 6120, TRUE),
  ('EXPENSE', NULL, '51', '01', '51.01.35', 'Transferuri din vp ale MS catre bug FNUASS', NULL, 'LEAF', NULL, 3, 6135, TRUE),
  ('EXPENSE', NULL, '51', '01', '51.01.38', 'Transf din BS catre BL pt finantarea UMS', NULL, 'LEAF', NULL, 3, 6138, TRUE),
  ('EXPENSE', NULL, '51', '01', '51.01.45', 'Transf din BS catre BL pt finantarea sanatatii', NULL, 'LEAF', NULL, 3, 6145, TRUE),
  ('EXPENSE', NULL, '51', '01', '51.01.73', 'Transf din BS catre BL pt decontare chelt carantina', NULL, 'LEAF', NULL, 3, 6173, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02', 'Transferuri de capital', NULL, 'GROUP', NULL, 2, 6200, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02.08', 'Ap med si echip de comunic in urgenta', NULL, 'LEAF', NULL, 3, 6210, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02.11', 'Transferuri pt RK la spitale', NULL, 'LEAF', NULL, 3, 6220, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02.12', 'Transferuri pt fin investitiilor la spitale', NULL, 'LEAF', NULL, 3, 6230, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02.17', 'Transferuri din BS catre BL pentru finantarea investitiilor in sanatate', NULL, 'LEAF', NULL, 3, 6217, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02.22', 'Transferuri din BS catre BL pentru finantarea aparaturii medicale si echip.de comunicatii in urgenta in sanatate', NULL, 'LEAF', NULL, 3, 6222, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02.23', 'Transferuri din BS catre BL pentru finantarea RK in sanatate', NULL, 'LEAF', NULL, 3, 6223, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02.24', 'Transferuri din BS catre BL pentru finantarea altor investitii in sanatate', NULL, 'LEAF', NULL, 3, 6224, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02.25', 'Transferuri din vp ale MS catre BL pt fin ap med si echip de comunic in urgenta in sanat', NULL, 'LEAF', NULL, 3, 6240, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02.26', 'Transferuri din vp ale MS catre BL pt fin RK in sanat', NULL, 'LEAF', NULL, 3, 6250, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02.27', 'Transferuri din vp ale MS catre BL pt fin altor investitii in sanat', NULL, 'LEAF', NULL, 3, 6260, TRUE),
  
  -- ALTE TRANSFERURI (Subcap 55)
  ('EXPENSE', NULL, '55', NULL, '55', 'ALTE TRANSFERURI', NULL, 'GROUP', NULL, 1, 6500, TRUE),
  ('EXPENSE', NULL, '55', '01', '55.01', 'Transferuri interne', NULL, 'GROUP', NULL, 2, 6510, TRUE),
  ('EXPENSE', NULL, '55', '01', '55.01.08', 'Program PHARE si alte programe cu fin.neramb', NULL, 'LEAF', NULL, 3, 6518, TRUE),
  ('EXPENSE', NULL, '55', '01', '55.01.48', 'Finantarea proiectelor de cercetare dezvoltare si inovare', NULL, 'LEAF', NULL, 3, 6548, TRUE),
  ('EXPENSE', NULL, '55', '02', '55.02', 'Transferuri curente in strainatate(catre org.internat)', NULL, 'GROUP', NULL, 2, 6600, TRUE),
  ('EXPENSE', NULL, '55', '02', '55.02.01', 'Contributii si cotizatii la organisme intermationale', NULL, 'LEAF', NULL, 3, 6601, TRUE),
  ('EXPENSE', NULL, '55', '36', '55.36', 'Transferuri reprez cofin publica in cadrul mecanismului fin norvegian pt promotorii de proiect/beneficiarii institutii publice', NULL, 'LEAF', NULL, 2, 6636, TRUE),
  ('EXPENSE', NULL, '55', '25', '55.25', 'Programul de cooperare elvetiano-roman vizand reduc disparitatilor econ si soc in cadrul UE', NULL, 'LEAF', NULL, 2, 6625, TRUE),
  
  -- PROIECTE CU FIN DIN FONDURI EXT NERAMB (Subcap 56)
  ('EXPENSE', NULL, '56', NULL, '56', 'PROIECTE CU FIN DIN FONDURI EXT NERAMB(FEN) POSTADE', NULL, 'GROUP', NULL, 1, 6700, TRUE),
  ('EXPENSE', NULL, '56', '01', '56.01', 'Programe din Fondul European de Dezv Regionala(FEDR)', NULL, 'GROUP', NULL, 2, 6710, TRUE),
  ('EXPENSE', NULL, '56', '01', '56.01.01', 'Finantare nat', NULL, 'LEAF', NULL, 3, 6711, TRUE),
  ('EXPENSE', NULL, '56', '01', '56.01.02', 'Finantare extema nerambursabila', NULL, 'LEAF', NULL, 3, 6712, TRUE),
  ('EXPENSE', NULL, '56', '01', '56.01.03', 'Cheltuieli neeligibile', NULL, 'LEAF', NULL, 3, 6713, TRUE),
  ('EXPENSE', NULL, '56', '02', '56.02', 'Programe din Fondul Social European', NULL, 'GROUP', NULL, 2, 6720, TRUE),
  ('EXPENSE', NULL, '56', '02', '56.02.01', 'Finantare nat', NULL, 'LEAF', NULL, 3, 6721, TRUE),
  ('EXPENSE', NULL, '56', '02', '56.02.02', 'Finantare externa nerambursabila', NULL, 'LEAF', NULL, 3, 6722, TRUE),
  ('EXPENSE', NULL, '56', '02', '56.02.03', 'Cheltuieli neeligibile', NULL, 'LEAF', NULL, 3, 6723, TRUE),
  
  -- ALTE CHELTUIELI (Subcap 59)
  ('EXPENSE', NULL, '59', NULL, '59', 'ALTE CHELTUIELI', NULL, 'GROUP', NULL, 1, 6800, TRUE),
  ('EXPENSE', NULL, '59', '01', '59.01', 'Burse', NULL, 'LEAF', NULL, 2, 6810, TRUE),
  ('EXPENSE', NULL, '59', '11', '59.11', 'Asociatii si fundatii', NULL, 'LEAF', NULL, 2, 6811, TRUE),
  ('EXPENSE', NULL, '59', '17', '59.17', 'Despagubiri civile', NULL, 'LEAF', NULL, 2, 6817, TRUE),
  ('EXPENSE', NULL, '59', '40', '59.40', 'Sume aferente persoanelor cu handicap neincadrate', NULL, 'LEAF', NULL, 2, 6840, TRUE),
  ('EXPENSE', NULL, '59', '60', '59.60', 'Proiecte cu finantare din sumele reprezentand asistenta financiara nerambursabila', NULL, 'GROUP', NULL, 2, 6860, TRUE),
  ('EXPENSE', NULL, '59', '60', '59.60.01', 'Fonduri europene nerambursabile', NULL, 'LEAF', NULL, 3, 6861, TRUE),
  ('EXPENSE', NULL, '59', '60', '59.60.03', 'Sume aferente TVA', NULL, 'LEAF', NULL, 3, 6863, TRUE),
  
  -- CHELTUIELI AFERENTE PROGR CU FIN RAMBURSABILA (Subcap 65)
  ('EXPENSE', NULL, '65', NULL, '65', 'CHELTUIELI AFERENTE PROGR CU FIN RAMBURSABILA', NULL, 'GROUP', NULL, 1, 6900, TRUE),
  ('EXPENSE', NULL, '65', '01', '65.01', 'Cheltuieli aferente progr cu fin rambursabila', NULL, 'LEAF', NULL, 2, 6910, TRUE),
  
  -- CHELTUIELI DE CAPITAL (Subcap 70)
  ('EXPENSE', NULL, '70', NULL, '70', 'CHELTUIELI DE CAPITAL', NULL, 'GROUP', '71+72', 0, 7000, TRUE),
  
  -- TITLUL X ACTIVE NEFINANCIARE (Subcap 71)
  ('EXPENSE', NULL, '71', NULL, '71', 'TITLUL X ACTIVE NEFINANCIARE', NULL, 'GROUP', '71.01+71.02', 1, 8000, TRUE),
  ('EXPENSE', NULL, '71', '01', '71.01', 'Active fixe (inclusiv reparatii capitale)', NULL, 'GROUP', NULL, 2, 8100, TRUE),
  ('EXPENSE', NULL, '71', '01', '71.01.01', 'Constructii', NULL, 'LEAF', NULL, 3, 8111, TRUE),
  ('EXPENSE', NULL, '71', '01', '71.01.02', 'Masini, echip.si mijl de transport', NULL, 'LEAF', NULL, 3, 8120, TRUE),
  ('EXPENSE', NULL, '71', '01', '71.01.03', 'Mobilier,ap. .birotica si alte active corporale', NULL, 'LEAF', NULL, 3, 8130, TRUE),
  ('EXPENSE', NULL, '71', '01', '71.01.30', 'Alte active fixe', NULL, 'LEAF', NULL, 3, 8140, TRUE),
  ('EXPENSE', NULL, '71', '03', '71.03', 'Reparatii capitale aferente activelor fixe', NULL, 'LEAF', NULL, 2, 8200, TRUE),
  
  -- TOTAL CHELTUIELI SUBCAPITOLE (Capitol 6610, Subcap 02)
  ('EXPENSE', '6610', '02', NULL, '6610.02', 'TOTAL CHELTUIELI SUBCAPITOLE', NULL, 'TITLE', NULL, 0, 9000, TRUE),
  ('EXPENSE', '6610', '02', NULL, '6610.02', 'Servicii publice descentralizate', NULL, 'LEAF', NULL, 1, 9020, TRUE),
  ('EXPENSE', '6610', '09', NULL, '6610.09', 'Hematologie si securitate transfuzionala', NULL, 'LEAF', NULL, 1, 9100, TRUE),
  ('EXPENSE', '6610', '50', NULL, '6610.50', 'Alte cheltuieli in domeniul sanatatii', NULL, 'LEAF', NULL, 1, 9200, TRUE),
  ('EXPENSE', '6610', '50', NULL, '6610.50', 'Alte institutii si actiuni sanitare', NULL, 'LEAF', NULL, 1, 9300, TRUE)

ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  ca_cb = VALUES(ca_cb),
  row_kind = VALUES(row_kind),
  calc_expression = VALUES(calc_expression),
  indent_level = VALUES(indent_level),
  display_order = VALUES(display_order),
  is_active = TRUE,
  updated_at = CURRENT_TIMESTAMP;
