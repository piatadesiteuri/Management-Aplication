-- Seed pentru "Buget anual" - Venituri și Cheltuieli
-- Include toate indicatorii conform structurii oficiale
-- Idempotent: ON DUPLICATE KEY UPDATE.

INSERT INTO budget_indicators
  (indicator_type, capitol, subcapitol, paragraf, indicator_code, name, ca_cb, row_kind, calc_expression, indent_level, display_order, is_active)
VALUES
  -- ============================================
  -- VENITURI PROPRII (REVENUE)
  -- ============================================
  
  -- VENITURI PROPRII - Total
  ('REVENUE', '0001', '10', NULL, '0001', 'VENITURI PROPRII', NULL, 'TITLE', NULL, 0, 100, TRUE),
  
  -- 1. VENITURI CURENTE
  ('REVENUE', '0002', '10', NULL, '0002', '1. VENITURI CURENTE', NULL, 'GROUP', NULL, 1, 200, TRUE),
  
  -- A. VENITURI FISCALE
  ('REVENUE', '0003', NULL, NULL, '0003', 'A. VENITURI FISCALE', NULL, 'GROUP', NULL, 2, 300, TRUE),
  ('REVENUE', '0004', NULL, NULL, '0004', 'A4. IMPOZITE SI TAXE PE BUNURI SI SERVICII', NULL, 'GROUP', NULL, 3, 310, TRUE),
  ('REVENUE', '1210', NULL, NULL, '1210', 'ALTE IMPOZITE SI TAXE GENERALE PE BUNURI SI SERVICII', NULL, 'LEAF', NULL, 4, 311, TRUE),
  ('REVENUE', '1410', NULL, NULL, '1410', 'ACCIZE', NULL, 'LEAF', NULL, 4, 312, TRUE),
  ('REVENUE', '1610', NULL, NULL, '1610', 'Taxe pentru utiliz bun.,autoriz utiliz bun sau pe desfasurarea pe activit(publicitate)', NULL, 'LEAF', NULL, 4, 313, TRUE),
  
  -- C. VENITURI NEFISCALE
  ('REVENUE', '2900', '10', NULL, '2900', 'C. VENITURI NEFISCALE', NULL, 'GROUP', NULL, 2, 400, TRUE),
  ('REVENUE', '3110', NULL, NULL, '3110', 'VENITURI DIN PROPRIETATE(DOBANZI)', NULL, 'LEAF', NULL, 3, 410, TRUE),
  ('REVENUE', '3310', NULL, NULL, '3310', 'VENITURI DIN PRESTARI DE SERVICII', NULL, 'LEAF', NULL, 3, 420, TRUE),
  ('REVENUE', '3610', NULL, NULL, '3610', 'DIVERSE VENITURI', NULL, 'LEAF', NULL, 3, 430, TRUE),
  ('REVENUE', NULL, '50', NULL, '50', 'Alte venituri', NULL, 'LEAF', NULL, 3, 440, TRUE),
  
  -- TRANSFERURI VOLUNTARE
  ('REVENUE', '3710', NULL, NULL, '3710', 'TRANSFERURI VOLUNTARE ALTELE DECAT SUBV', NULL, 'GROUP', NULL, 2, 500, TRUE),
  ('REVENUE', '3710', NULL, '01', '3710.01', 'Donatii si sponsorizari', NULL, 'LEAF', NULL, 3, 510, TRUE),
  
  -- 3. OPERATIUNI FINANCIARE
  ('REVENUE', '4010', NULL, NULL, '4010', '3. OPERATIUNI FINANCIARE', NULL, 'GROUP', NULL, 1, 600, TRUE),
  
  -- Venituri proprii redistrib
  ('REVENUE', '4110', '07', NULL, '4110', 'Venituri proprii redistrib intre instit pub fin integral/partial din venituri proprii sau intre activ fin integr din venituri proprii', NULL, 'LEAF', NULL, 2, 700, TRUE),
  
  -- VENITURI PROPRII-TOTAL CHELTUIELI
  ('REVENUE', '5010', NULL, NULL, '5010', 'VENITURI PROPRII-TOTAL CHELTUIELI', NULL, 'TITLE', NULL, 0, 800, TRUE),
  
  -- SANATATE
  ('REVENUE', '6610', NULL, NULL, '6610', 'SANATATE', NULL, 'TITLE', NULL, 0, 900, TRUE),
  
  -- ============================================
  -- CHELTUIELI (EXPENSE)
  -- ============================================
  
  -- CHELTUIELI CURENTE
  ('EXPENSE', '01', NULL, NULL, '01', 'CHELTUIELI CURENTE', NULL, 'GROUP', '10+20+30+40+50+51+55+57+59', 0, 1000, TRUE),
  ('EXPENSE', '01', '10', NULL, '01.10', 'CHELTUIELI CURENTE', NULL, 'GROUP', NULL, 1, 1010, TRUE),
  
  -- TITLUL I CHELTUIELI DE PERSONAL
  ('EXPENSE', NULL, '10', NULL, '10', 'TITLUL I CHELTUIELI DE PERSONAL (cod 10.01+10.02+10.03)', NULL, 'GROUP', '10.01+10.02+10.03', 1, 2000, TRUE),
  ('EXPENSE', NULL, '10', NULL, '10', 'TITLUL I CHELTUIELI DE PERSONAL', NULL, 'GROUP', NULL, 1, 2010, TRUE),
  
  -- Cheltuieli salariale in bani
  ('EXPENSE', NULL, '10', NULL, '10.01', 'Cheltuieli salariale in bani (cod 10.01.01 la 10.01.30)', NULL, 'GROUP', NULL, 2, 2100, TRUE),
  ('EXPENSE', NULL, '10', NULL, '10.01', 'Cheltuieli salariale in bani', NULL, 'GROUP', NULL, 2, 2110, TRUE),
  ('EXPENSE', NULL, '10', '01', '10.01.01', 'Salarii de bază', NULL, 'LEAF', NULL, 3, 2111, TRUE),
  ('EXPENSE', NULL, '10', '01', '10.01.01', 'Salarii de bază', NULL, 'LEAF', NULL, 3, 2112, TRUE),
  ('EXPENSE', NULL, '10', '02', '10.01.02', 'Salarii de merit', NULL, 'LEAF', NULL, 3, 2120, TRUE),
  ('EXPENSE', NULL, '10', '02', '10.01.02', 'Salarii de merit', NULL, 'LEAF', NULL, 3, 2121, TRUE),
  ('EXPENSE', NULL, '10', '03', '10.01.03', 'Indemnizații de conducere', NULL, 'LEAF', NULL, 3, 2130, TRUE),
  ('EXPENSE', NULL, '10', '03', '10.01.03', 'Indemnizații de conducere', NULL, 'LEAF', NULL, 3, 2131, TRUE),
  ('EXPENSE', NULL, '10', '04', '10.01.04', 'Spor de vechime', NULL, 'LEAF', NULL, 3, 2140, TRUE),
  ('EXPENSE', NULL, '10', '04', '10.01.04', 'Spor de vechime', NULL, 'LEAF', NULL, 3, 2141, TRUE),
  ('EXPENSE', NULL, '10', '05', '10.01.05', 'Sporuri pentru condiții de muncă', NULL, 'LEAF', NULL, 3, 2150, TRUE),
  ('EXPENSE', NULL, '10', '05', '10.01.05', 'Sporuri pentru condiții de munca', NULL, 'LEAF', NULL, 3, 2151, TRUE),
  ('EXPENSE', NULL, '10', '06', '10.01.06', 'Alte sporuri', NULL, 'LEAF', NULL, 3, 2160, TRUE),
  ('EXPENSE', NULL, '10', '06', '10.01.06', 'Alte sporuri', NULL, 'LEAF', NULL, 3, 2161, TRUE),
  ('EXPENSE', NULL, '10', '07', '10.01.07', 'Ore suplimentare', NULL, 'LEAF', NULL, 3, 2170, TRUE),
  ('EXPENSE', NULL, '10', '07', '10.01.07', 'Ore suplimentare', NULL, 'LEAF', NULL, 3, 2171, TRUE),
  ('EXPENSE', NULL, '10', '08', '10.01.08', 'Fond de premii', NULL, 'LEAF', NULL, 3, 2180, TRUE),
  ('EXPENSE', NULL, '10', '08', '10.01.08', 'Fond de premii', NULL, 'LEAF', NULL, 3, 2181, TRUE),
  ('EXPENSE', NULL, '10', '09', '10.01.09', 'Prima de vacanță', NULL, 'LEAF', NULL, 3, 2190, TRUE),
  ('EXPENSE', NULL, '10', '09', '10.01.09', 'Prima de vacanta', NULL, 'LEAF', NULL, 3, 2191, TRUE),
  ('EXPENSE', NULL, '10', '10', '10.01.10', 'Fond pentru posturi ocupate prin cumul', NULL, 'LEAF', NULL, 3, 2200, TRUE),
  ('EXPENSE', NULL, '10', '10', '10.01.10', 'Fond pentru posturi ocupate prin cumul', NULL, 'LEAF', NULL, 3, 2201, TRUE),
  ('EXPENSE', NULL, '10', '11', '10.01.11', 'Fond aferent plății cu ora', NULL, 'LEAF', NULL, 3, 2210, TRUE),
  ('EXPENSE', NULL, '10', '11', '10.01.11', 'Fond aferent plații cu ora', NULL, 'LEAF', NULL, 3, 2211, TRUE),
  ('EXPENSE', NULL, '10', '12', '10.01.12', 'Indemnizații plătite unor persoane din afara unitații', NULL, 'LEAF', NULL, 3, 2220, TRUE),
  ('EXPENSE', NULL, '10', '12', '10.01.12', 'Indemnizații plătite unor persoane din afara unitații', NULL, 'LEAF', NULL, 3, 2221, TRUE),
  ('EXPENSE', NULL, '10', '13', '10.01.13', 'Indemnizații de delegare', NULL, 'LEAF', NULL, 3, 2230, TRUE),
  ('EXPENSE', NULL, '10', '13', '10.01.13', 'Indemnizații de delegare', NULL, 'LEAF', NULL, 3, 2231, TRUE),
  ('EXPENSE', NULL, '10', '30', '10.01.30', 'Alte drepturi salariale in bani', NULL, 'LEAF', NULL, 3, 2240, TRUE),
  ('EXPENSE', NULL, '10', '30', '10.01.30', 'Alte drepturi salariale in bani', NULL, 'LEAF', NULL, 3, 2241, TRUE),
  
  -- Contribuții
  ('EXPENSE', NULL, '03', NULL, '10.03', 'Contribuții', NULL, 'GROUP', NULL, 2, 3000, TRUE),
  ('EXPENSE', NULL, '03', NULL, '10.03', 'Contributii', NULL, 'GROUP', NULL, 2, 3010, TRUE),
  ('EXPENSE', NULL, '03', '01', '10.03.01', 'Contribuții pentru asigurări sociale de stat', NULL, 'LEAF', NULL, 3, 3011, TRUE),
  ('EXPENSE', NULL, '03', '01', '10.03.01', 'Contribuții pentru asigurări sociale de stat', NULL, 'LEAF', NULL, 3, 3012, TRUE),
  ('EXPENSE', NULL, '03', '02', '10.03.02', 'Contribuții pentru asigurările de șomaj', NULL, 'LEAF', NULL, 3, 3020, TRUE),
  ('EXPENSE', NULL, '03', '02', '10.03.02', 'Contribuții pentru asigurările de șomaj', NULL, 'LEAF', NULL, 3, 3021, TRUE),
  ('EXPENSE', NULL, '03', '03', '10.03.03', 'Contribuții pentru asigurările sociale de sănătate', NULL, 'LEAF', NULL, 3, 3030, TRUE),
  ('EXPENSE', NULL, '03', '03', '10.03.03', 'Contributii pentru asigurările sociale de sănătate', NULL, 'LEAF', NULL, 3, 3031, TRUE),
  ('EXPENSE', NULL, '03', '04', '10.03.04', 'Contribuții de asigurari pt accidente de munca si boli profes.', NULL, 'LEAF', NULL, 3, 3040, TRUE),
  ('EXPENSE', NULL, '03', '04', '10.03.04', 'Contribuții de asigurari pt accidente de munca si boli profes.', NULL, 'LEAF', NULL, 3, 3041, TRUE),
  ('EXPENSE', NULL, '03', '90', '10.03.90', 'Contribuții pentru concedii si indemnizații', NULL, 'LEAF', NULL, 3, 3050, TRUE),
  ('EXPENSE', NULL, '03', '90', '10.03.90', 'Contribuții pentru concedii si indemnizații', NULL, 'LEAF', NULL, 3, 3051, TRUE),
  ('EXPENSE', NULL, '03', '07', '10.03.07', 'Contribuții la Fondul de garantare a creanțelor salariale', NULL, 'LEAF', NULL, 3, 3060, TRUE),
  ('EXPENSE', NULL, '03', '07', '10.03.07', 'Contribuții la Fondul de garantare a creanțelor salariale', NULL, 'LEAF', NULL, 3, 3061, TRUE),
  
  -- TITLUL II BUNURI ȘI SERVICII
  ('EXPENSE', NULL, '20', NULL, '20', 'TITLUL II BUNURI ȘI SERVICII', NULL, 'GROUP', NULL, 1, 4000, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01', 'Bunuri și servicii', NULL, 'GROUP', NULL, 2, 4100, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01', 'Bunuri și servicii', NULL, 'GROUP', NULL, 2, 4110, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.01', 'Furnituri de birou', NULL, 'LEAF', NULL, 3, 4111, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.01', 'Furnituri de birou', NULL, 'LEAF', NULL, 3, 4112, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.02', 'Materiale pentru curățenie', NULL, 'LEAF', NULL, 3, 4120, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.02', 'Materiale pentru curătenie', NULL, 'LEAF', NULL, 3, 4121, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.03', 'Iluminat, incălzit și forță motrică', NULL, 'LEAF', NULL, 3, 4130, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.03', 'Iluminat, incălzit și fortă motrică', NULL, 'LEAF', NULL, 3, 4131, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.04', 'Apă, canal si salubritate', NULL, 'LEAF', NULL, 3, 4140, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.04', 'Apă, canal si salubritate', NULL, 'LEAF', NULL, 3, 4141, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.05', 'Carburanți si lubrifianți', NULL, 'LEAF', NULL, 3, 4150, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.05', 'Carburantți si lubrifianti', NULL, 'LEAF', NULL, 3, 4151, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.06', 'Piese de schimb', NULL, 'LEAF', NULL, 3, 4160, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.06', 'Piese de schimb', NULL, 'LEAF', NULL, 3, 4161, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.07', 'Transport', NULL, 'LEAF', NULL, 3, 4170, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.07', 'Transport', NULL, 'LEAF', NULL, 3, 4171, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.08', 'Poștă, telecomunicatii, radio, tv, internet', NULL, 'LEAF', NULL, 3, 4180, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.08', 'Poştă, telecomunicatii, radio, tv, internet', NULL, 'LEAF', NULL, 3, 4181, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.09', 'Materiale si prestări de servicii cu caracter funcțional', NULL, 'LEAF', NULL, 3, 4190, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.09', 'Materiale si prestări de servicii cu caracter funcțional', NULL, 'LEAF', NULL, 3, 4191, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.30', 'Alte bunuri și servicii pentru întreținere si funcționare', NULL, 'LEAF', NULL, 3, 4200, TRUE),
  ('EXPENSE', NULL, '20', '01', '20.01.30', 'Alte bunuri și servicii pentru întreținere si functionare', NULL, 'LEAF', NULL, 3, 4201, TRUE),
  ('EXPENSE', NULL, '20', '02', '20.02', 'Reparații curente', NULL, 'LEAF', NULL, 2, 4300, TRUE),
  ('EXPENSE', NULL, '20', '02', '20.02', 'Reparatii curente', NULL, 'LEAF', NULL, 2, 4310, TRUE),
  ('EXPENSE', NULL, '20', '03', '20.03', 'Hrană', NULL, 'GROUP', NULL, 2, 4400, TRUE),
  ('EXPENSE', NULL, '20', '03', '20.03', 'Hrană', NULL, 'GROUP', NULL, 2, 4410, TRUE),
  ('EXPENSE', NULL, '20', '03', '20.03.01', 'Hrană pentru oameni', NULL, 'LEAF', NULL, 3, 4411, TRUE),
  ('EXPENSE', NULL, '20', '03', '20.03.01', 'Hrană pentru oameni', NULL, 'LEAF', NULL, 3, 4412, TRUE),
  ('EXPENSE', NULL, '20', '03', '20.03.02', 'Hrană pentru animale', NULL, 'LEAF', NULL, 3, 4420, TRUE),
  ('EXPENSE', NULL, '20', '03', '20.03.02', 'Hrană pentru animale', NULL, 'LEAF', NULL, 3, 4421, TRUE),
  ('EXPENSE', NULL, '20', '04', '20.04', 'Medicamente și materiale sanitare', NULL, 'GROUP', NULL, 2, 4500, TRUE),
  ('EXPENSE', NULL, '20', '04', '20.04', 'Medicamente și materiale sanitare', NULL, 'GROUP', NULL, 2, 4510, TRUE),
  ('EXPENSE', NULL, '20', '04', '20.04.01', 'Medicamente', NULL, 'LEAF', NULL, 3, 4511, TRUE),
  ('EXPENSE', NULL, '20', '04', '20.04.01', 'Medicamente', NULL, 'LEAF', NULL, 3, 4512, TRUE),
  ('EXPENSE', NULL, '20', '04', '20.04.02', 'Materiale sanitare', NULL, 'LEAF', NULL, 3, 4520, TRUE),
  ('EXPENSE', NULL, '20', '04', '20.04.02', 'Materiale sanitare', NULL, 'LEAF', NULL, 3, 4521, TRUE),
  ('EXPENSE', NULL, '20', '04', '20.04.03', 'Reactivi', NULL, 'LEAF', NULL, 3, 4530, TRUE),
  ('EXPENSE', NULL, '20', '04', '20.04.03', 'Reactivi', NULL, 'LEAF', NULL, 3, 4531, TRUE),
  ('EXPENSE', NULL, '20', '04', '20.04.04', 'Dezinfectanți', NULL, 'LEAF', NULL, 3, 4540, TRUE),
  ('EXPENSE', NULL, '20', '04', '20.04.04', 'Dezinfectanti', NULL, 'LEAF', NULL, 3, 4541, TRUE),
  ('EXPENSE', NULL, '20', '05', '20.05', 'Bunuri de natura obiectelor de inventar', NULL, 'GROUP', NULL, 2, 4600, TRUE),
  ('EXPENSE', NULL, '20', '05', '20.05', 'Bunuri de natura obiectelor de inventar', NULL, 'GROUP', NULL, 2, 4610, TRUE),
  ('EXPENSE', NULL, '20', '05', '20.05.01', 'Uniforme si echipament', NULL, 'LEAF', NULL, 3, 4611, TRUE),
  ('EXPENSE', NULL, '20', '05', '20.05.01', 'Uniforme si echipament', NULL, 'LEAF', NULL, 3, 4612, TRUE),
  ('EXPENSE', NULL, '20', '05', '20.05.03', 'Lenjerie si accesorii de pat', NULL, 'LEAF', NULL, 3, 4620, TRUE),
  ('EXPENSE', NULL, '20', '05', '20.05.03', 'Lenjerie si accesorii de pat', NULL, 'LEAF', NULL, 3, 4621, TRUE),
  ('EXPENSE', NULL, '20', '05', '20.05.30', 'Alte obiecte de inventar', NULL, 'LEAF', NULL, 3, 4630, TRUE),
  ('EXPENSE', NULL, '20', '05', '20.05.30', 'Alte obiecte de inventar', NULL, 'LEAF', NULL, 3, 4631, TRUE),
  ('EXPENSE', NULL, '20', '06', '20.06', 'Deplasări, detașări, transferări', NULL, 'GROUP', NULL, 2, 4700, TRUE),
  ('EXPENSE', NULL, '20', '06', '20.06', 'Deplasări, detașări, transferări', NULL, 'GROUP', NULL, 2, 4710, TRUE),
  ('EXPENSE', NULL, '20', '06', '20.06.01', 'Deplasări interne, detașări, transferări', NULL, 'LEAF', NULL, 3, 4711, TRUE),
  ('EXPENSE', NULL, '20', '06', '20.06.01', 'Deplasări interne, detașări, transferări', NULL, 'LEAF', NULL, 3, 4712, TRUE),
  ('EXPENSE', NULL, '20', '09', '20.09', 'Materiale de laborator', NULL, 'LEAF', NULL, 2, 4800, TRUE),
  ('EXPENSE', NULL, '20', '09', '20.09', 'Materiale de laborator', NULL, 'LEAF', NULL, 2, 4810, TRUE),
  ('EXPENSE', NULL, '20', '11', '20.11', 'Cărți, publicații si materiale documentare', NULL, 'LEAF', NULL, 2, 4900, TRUE),
  ('EXPENSE', NULL, '20', '11', '20.11', 'Cărti, publicații si materiale documentare', NULL, 'LEAF', NULL, 2, 4910, TRUE),
  ('EXPENSE', NULL, '20', '12', '20.12', 'Consultanta si expertiza', NULL, 'LEAF', NULL, 2, 5000, TRUE),
  ('EXPENSE', NULL, '20', '12', '20.12', 'Consultanta si expertiza', NULL, 'LEAF', NULL, 2, 5010, TRUE),
  ('EXPENSE', NULL, '20', '13', '20.13', 'Pregatire profesională', NULL, 'LEAF', NULL, 2, 5100, TRUE),
  ('EXPENSE', NULL, '20', '13', '20.13', 'Pregatire profesională', NULL, 'LEAF', NULL, 2, 5110, TRUE),
  ('EXPENSE', NULL, '20', '14', '20.14', 'Protecția muncii', NULL, 'LEAF', NULL, 2, 5200, TRUE),
  ('EXPENSE', NULL, '20', '14', '20.14', 'Protecția muncii', NULL, 'LEAF', NULL, 2, 5210, TRUE),
  ('EXPENSE', NULL, '20', '30', '20.30', 'Alte cheltuieli', NULL, 'LEAF', NULL, 2, 5300, TRUE),
  ('EXPENSE', NULL, '20', '30', '20.30', 'Alte cheltuieli', NULL, 'LEAF', NULL, 2, 5310, TRUE),
  ('EXPENSE', NULL, '20', '30', '20.30.04', 'Chirii', NULL, 'LEAF', NULL, 3, 5320, TRUE),
  ('EXPENSE', NULL, '20', '30', '20.30.04', 'Chirii', NULL, 'LEAF', NULL, 3, 5321, TRUE),
  ('EXPENSE', NULL, '20', '30', '20.30.09', 'Executare silita a creantelor bugetare', NULL, 'LEAF', NULL, 3, 5330, TRUE),
  ('EXPENSE', NULL, '20', '30', '20.30.09', 'Executare silita a creantelor bugetare', NULL, 'LEAF', NULL, 3, 5331, TRUE),
  ('EXPENSE', NULL, '20', '30', '20.30.30', 'Alte cheltuieli cu bunuri și servicii', NULL, 'LEAF', NULL, 3, 5340, TRUE),
  ('EXPENSE', NULL, '20', '30', '20.30.30', 'Alte cheltuieli cu bunuri și servicii', NULL, 'LEAF', NULL, 3, 5341, TRUE),
  
  -- TITLUL VI TRANSFERURI
  ('EXPENSE', NULL, '51', NULL, '51', 'TITLUL VI TRANSFERURI INTRE UNITATI ALE ADM PUBLICE', NULL, 'GROUP', NULL, 1, 6000, TRUE),
  ('EXPENSE', NULL, '51', '01', '51.01', 'Transferuri curente', NULL, 'GROUP', NULL, 2, 6100, TRUE),
  ('EXPENSE', NULL, '51', '01', '51.01.03', 'Actiuni de sanatate', NULL, 'LEAF', NULL, 3, 6110, TRUE),
  ('EXPENSE', NULL, '51', '01', '51.01.25', 'Programe pt sanatate', NULL, 'LEAF', NULL, 3, 6120, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02', 'Transferuri de capital', NULL, 'GROUP', NULL, 2, 6200, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02.08', 'Ap med si echip de comunic in urgenta', NULL, 'LEAF', NULL, 3, 6210, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02.11', 'Transferuri pt RK la spitale', NULL, 'LEAF', NULL, 3, 6220, TRUE),
  ('EXPENSE', NULL, '51', '02', '51.02.12', 'Transferuri pt fin investitiilor la spitale', NULL, 'LEAF', NULL, 3, 6230, TRUE),
  
  -- CHELTUIELI DE CAPITAL
  ('EXPENSE', NULL, '70', NULL, '70', 'CHELTUIELI DE CAPITAL', NULL, 'GROUP', '71+72', 0, 7000, TRUE),
  ('EXPENSE', NULL, '70', NULL, '70', 'CHELTUIELI DE CAPITAL', NULL, 'GROUP', NULL, 0, 7010, TRUE),
  
  -- TITLUL X ACTIVE NEFINANCIARE
  ('EXPENSE', NULL, '71', NULL, '71', 'TITLUL X ACTIVE NEFINANCIARE (cod 71.01+71.02)', NULL, 'GROUP', '71.01+71.02', 1, 8000, TRUE),
  ('EXPENSE', NULL, '71', NULL, '71', 'TITLUL X ACTIVE NEFINANCIARE', NULL, 'GROUP', NULL, 1, 8010, TRUE),
  ('EXPENSE', NULL, '71', '01', '71.01', 'Active fixe (inclusiv reparatii capitale)', NULL, 'GROUP', NULL, 2, 8100, TRUE),
  ('EXPENSE', NULL, '71', '01', '71.01', 'Active fixe', NULL, 'GROUP', NULL, 2, 8110, TRUE),
  ('EXPENSE', NULL, '71', '01', '71.01.01', 'Constructii', NULL, 'LEAF', NULL, 3, 8111, TRUE),
  ('EXPENSE', NULL, '71', '01', '71.01.02', 'Masini, echip.si mijl de transport', NULL, 'LEAF', NULL, 3, 8120, TRUE),
  ('EXPENSE', NULL, '71', '01', '71.01.02', 'Masini, echip.si mijl de transport', NULL, 'LEAF', NULL, 3, 8121, TRUE),
  ('EXPENSE', NULL, '71', '01', '71.01.03', 'Mobilier, aparatura, birotica', NULL, 'LEAF', NULL, 3, 8130, TRUE),
  ('EXPENSE', NULL, '71', '01', '71.01.30', 'Alte active fixe', NULL, 'LEAF', NULL, 3, 8140, TRUE),
  ('EXPENSE', NULL, '71', '03', '71.03', 'Reparatii capitale aferente activelor fixe', NULL, 'LEAF', NULL, 2, 8200, TRUE),
  ('EXPENSE', NULL, '71', '03', '71.03', 'Reparatii capitale aferente activelor fixe', NULL, 'LEAF', NULL, 2, 8210, TRUE),
  
  -- TOTAL CHELTUIELI SUBCAPITOLE
  ('EXPENSE', '6610', '02', NULL, '6610.02', 'TOTAL CHELTUIELI SUBCAPITOLE', NULL, 'TITLE', NULL, 0, 9000, TRUE),
  ('EXPENSE', '6610', '02', NULL, '6610.02', 'TOTAL CHELTUIELI SUBCAPITOLE', NULL, 'TITLE', NULL, 0, 9010, TRUE),
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

