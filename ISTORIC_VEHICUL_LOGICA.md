# Logica Istoricului Vehiculului - DSPD

## Prezentare Generală

Sistemul de istoric vehicul din DSPD permite urmărirea completă a activităților pentru fiecare vehicul din parcul auto. Istoricul include trei categorii principale:

1. **Mentenanță** - Toate intervențiile tehnice
2. **Combustibil** - Toate alimentările și consumul
3. **Utilizare** - Toate deplasările și misiunile

## Structura Bazei de Date

### 1. Tabelul `vehicle_maintenance`
```sql
CREATE TABLE vehicle_maintenance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  cost DECIMAL(10,2) DEFAULT 0.00,
  mileage INT DEFAULT 0,
  performed_by VARCHAR(255),
  status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'COMPLETED',
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Tipuri de mentenanță:**
- Revizie periodică
- Reparație
- ITP (Inspecție Tehnică Periodică)
- Înlocuire piese
- Verificări tehnice

### 2. Tabelul `vehicle_fuel_records`
```sql
CREATE TABLE vehicle_fuel_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  date DATE NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  mileage INT NOT NULL,
  fuel_type ENUM('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID') DEFAULT 'DIESEL',
  location VARCHAR(255),
  driver VARCHAR(255),
  efficiency DECIMAL(5,2) COMMENT 'L/100km',
  cost_per_km DECIMAL(8,4) COMMENT 'RON/km',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Calculul eficienței:**
- Efficiency = (quantity * 100) / km_parcurși
- Cost per km = cost / km_parcurși

### 3. Tabelul `vehicle_usage_records`
```sql
CREATE TABLE vehicle_usage_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  user_id INT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_mileage INT NOT NULL,
  end_mileage INT NOT NULL,
  purpose VARCHAR(255),
  route TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. Obținerea Istoricului Complet
```
GET /api/vehicles/:id/history
```

**Răspuns:**
```json
{
  "maintenance": [
    {
      "id": 1,
      "vehicle_id": 1,
      "date": "2024-01-15",
      "type": "Revizie periodică",
      "description": "Schimb ulei motor, filtru ulei, filtru aer",
      "cost": 450.50,
      "mileage": 45000,
      "performed_by": "Service Auto Dolj",
      "status": "COMPLETED",
      "priority": "MEDIUM"
    }
  ],
  "fuel": [
    {
      "id": 1,
      "vehicle_id": 1,
      "date": "2024-01-20",
      "quantity": 45.5,
      "cost": 318.50,
      "mileage": 45200,
      "fuel_type": "DIESEL",
      "location": "Petrom Craiova",
      "driver": "Ion Popescu",
      "efficiency": 14.2,
      "cost_per_km": 0.65
    }
  ],
  "usage": [
    {
      "id": 1,
      "vehicle_id": 1,
      "user_id": 1,
      "start_date": "2024-01-18",
      "end_date": "2024-01-20",
      "start_mileage": 45000,
      "end_mileage": 45200,
      "purpose": "Inspecție în teren",
      "route": "Craiova - Calafat - Craiova"
    }
  ]
}
```

### 2. Adăugarea Înregistrărilor

#### Mentenanță
```
POST /api/vehicles/:id/maintenance
```

**Body:**
```json
{
  "date": "2024-01-15",
  "type": "Revizie periodică",
  "description": "Schimb ulei motor, filtru ulei, filtru aer",
  "cost": 450.50,
  "mileage": 45000,
  "performedBy": "Service Auto Dolj",
  "status": "COMPLETED",
  "priority": "MEDIUM"
}
```

#### Combustibil
```
POST /api/vehicles/:id/fuel
```

**Body:**
```json
{
  "date": "2024-01-20",
  "quantity": 45.5,
  "cost": 318.50,
  "mileage": 45200,
  "fuelType": "DIESEL",
  "location": "Petrom Craiova",
  "driver": "Ion Popescu",
  "efficiency": 14.2,
  "costPerKm": 0.65
}
```

#### Utilizare
```
POST /api/vehicles/:id/usage
```

**Body:**
```json
{
  "userId": 1,
  "startDate": "2024-01-18",
  "endDate": "2024-01-20",
  "startMileage": 45000,
  "endMileage": 45200,
  "purpose": "Inspecție în teren",
  "route": "Craiova - Calafat - Craiova"
}
```

## Logica Frontend

### 1. Componenta VehicleHistory
Componenta `VehicleHistory.tsx` afișează istoricul complet al vehiculului în 3 tab-uri:

- **Tab Mentenanță**: Afișează toate intervențiile tehnice
- **Tab Combustibil**: Afișează toate alimentările și consumul
- **Tab Utilizare**: Afișează toate deplasările

### 2. Încărcarea Datelor
```typescript
const loadHistoryData = async () => {
  try {
    const vehicleService = new VehicleService();
    const historyData = await vehicleService.getVehicleHistory(vehicle.id);
    
    // Transform datele pentru a fi compatibile cu interfața
    const transformedMaintenance = historyData.maintenance.map(record => ({
      id: record.id,
      date: record.date,
      type: record.type,
      description: record.description,
      cost: record.cost,
      mileage: record.mileage,
      performedBy: record.performed_by,
      status: record.status,
      priority: record.priority,
    }));
    
    setMaintenanceHistory(transformedMaintenance);
    setFuelHistory(transformedFuel);
    setUsageHistory(transformedUsage);
  } catch (error) {
    // Gestionarea erorilor
  }
};
```

### 3. Statistici Calculate
Componenta calculează automat:
- **Total costuri mentenanță**: Suma tuturor costurilor de mentenanță
- **Total costuri combustibil**: Suma tuturor costurilor de combustibil
- **Eficiența medie**: Media eficienței combustibilului
- **Km totali parcurși**: Suma kilometrilor din toate deplasările

## Cum să Adaugi Date Noi

### 1. Prin Interface (Viitor)
Se vor adăuga formulare pentru:
- Adăugarea înregistrărilor de mentenanță
- Adăugarea înregistrărilor de combustibil
- Adăugarea înregistrărilor de utilizare

### 2. Prin Baza de Date (Actual)
Poți adăuga date direct în baza de date:

```sql
-- Adaugă o nouă înregistrare de mentenanță
INSERT INTO vehicle_maintenance (vehicle_id, date, type, description, cost, mileage, performed_by, status, priority) 
VALUES (1, '2024-02-01', 'Revizie periodică', 'Schimb ulei și filtre', 400.00, 46000, 'Service Auto Dolj', 'COMPLETED', 'MEDIUM');

-- Adaugă o nouă înregistrare de combustibil
INSERT INTO vehicle_fuel_records (vehicle_id, date, quantity, cost, mileage, fuel_type, location, driver, efficiency, cost_per_km) 
VALUES (1, '2024-02-01', 50.0, 350.00, 46000, 'DIESEL', 'Petrom Craiova', 'Ion Popescu', 14.0, 0.70);

-- Adaugă o nouă înregistrare de utilizare
INSERT INTO vehicle_usage_records (vehicle_id, user_id, start_date, end_date, start_mileage, end_mileage, purpose, route) 
VALUES (1, 1, '2024-02-01', '2024-02-03', 46000, 46300, 'Inspecție sanitară', 'Craiova - Slatina - Craiova');
```

## Beneficii

1. **Urmărirea Completă**: Toate activitățile vehiculului sunt înregistrate
2. **Analiză Costuri**: Calculul automat al costurilor totale
3. **Eficiența Combustibilului**: Monitorizarea consumului
4. **Planificare Mentenanță**: Urmărirea intervențiilor tehnice
5. **Raportare**: Generarea de rapoarte detaliate

## Următorii Pași

1. **Formulare de Adăugare**: Implementarea formularelor pentru adăugarea datelor
2. **Editare/Ștergere**: Funcționalități de modificare a înregistrărilor
3. **Rapoarte**: Generarea de rapoarte PDF
4. **Notificări**: Alerte pentru mentenanță programată
5. **Dashboard**: Statistici generale pentru toate vehiculele 