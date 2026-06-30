Implementare Cautare Automată Locatii

### API Extern
- **Endpoint**: `https://nominatim.openstreetmap.org/search`

## 📡 API Endpoint și Parametri


### Parametri de Căutare
```javascript
const params = {
  q: searchQuery,                    
  format: 'json',                   
  addressdetails: 1,                
  limit: 8,                          
  accept-language: 'ro',             
  countrycodes: 'ro'           
};
```

### Headers Necesari
```javascript
const headers = {
  'Accept-Language': 'ro',
  'User-Agent': 'YourApp-Name/1.0' 
};
```

### Exemplu de Request
```javascript
const response = await fetch(
  `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=8&accept-language=ro&countrycodes=ro`,
  {
    headers: {
      'Accept-Language': 'ro',
      'User-Agent': 'YourApp-1.0'
    }
  }
);
```

## 📊 Structura Datelor

### Request
- **Input**: String cu textul de căutare (minim 2 caractere)

### Response
```typescript
interface LocationSuggestion {
  place_id: number;   
  display_name: string;  
  lat: string;           
  lon: string;           
  type: string;         
  address?: {            
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}
```

### Exemplu de Response
```json
[
  {
    "place_id": 123456789,
    "display_name": "Grigore Antipa, Strada Unirii, Santa Maria Bay, Faleză Nord, Constanța, Zona Metropolitană Constanţa, Constanţa, 900581, România",
    "lat": "44.1733",
    "lon": "28.6383",
    "type": "artwork",
    "address": {
      "house_number": "1",
      "road": "Strada Unirii",
      "city": "Constanța",
      "state": "Constanța",
      "country": "România"
    }
  }
]
```

## 🏗️ Implementare Frontend

### 1. Componenta Principală

```typescript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from 'lodash';

interface LocationSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}
```

### 2. State Management

```typescript
const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
const [isOpen, setIsOpen] = useState(false);
const [loading, setLoading] = useState(false);
const [selectedLocation, setSelectedLocation] = useState<string>('');
const [selectedCoordinates, setSelectedCoordinates] = useState<{lat: string, lon: string} | null>(null);
```

### 3. Funcția de Căutare cu Debouncing

```typescript
const fetchSuggestions = useCallback(
  debounce(async (input: string) => {
    if (!input || input.length < 2) return;

    try {
      setLoading(true);
      
      const searchQuery = input.trim();
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=8&accept-language=ro&countrycodes=ro`,
        {
          headers: {
            'Accept-Language': 'ro',
            'User-Agent': 'YourApp-1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Filtrare pentru rezultate mai relevante
      const filteredData = data
        .filter((item: any) => {
          const displayName = item.display_name.toLowerCase();
          const searchTerms = searchQuery.toLowerCase().split(' ');
          return searchTerms.every(term => displayName.includes(term));
        })
        .slice(0, 6);
      
      setSuggestions(filteredData);
      setIsOpen(filteredData.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  }, 200), // Debounce de 200ms
  []
);
```

### 4. Event Handlers

```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newValue = e.target.value;
  onChange(newValue);
  setSelectedLocation('');
  setSelectedCoordinates(null);
  
  if (newValue.length >= 2 && suggestions.length > 0) {
    setIsOpen(true);
  }
};

const handleSuggestionClick = (suggestion: LocationSuggestion) => {
  onChange(suggestion.display_name);
  setSelectedLocation(suggestion.display_name);
  setSelectedCoordinates({ lat: suggestion.lat, lon: suggestion.lon });
  setIsOpen(false);
};

const handleClear = () => {
  onChange('');
  setSelectedLocation('');
  setSelectedCoordinates(null);
  setIsOpen(false);
};
```

### 5. Funcția de Deschidere pe Hartă

```typescript
const openInMaps = () => {
  if (selectedCoordinates) {
    const lat = selectedCoordinates.lat;
    const lon = selectedCoordinates.lon;
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=16`, '_blank');
  } else if (value) {
    const encodedLocation = encodeURIComponent(value);
    window.open(`https://www.openstreetmap.org/search?query=${encodedLocation}`, '_blank');
  }
};
```

## 🎨 Interfața Utilizator

### Structura HTML/JSX

```jsx
<FormControl position="relative">
  <FormLabel>
    <HStack spacing={3}>
      <Icon as={FiMapPin} />
      <Text>Locație Eveniment</Text>
    </HStack>
  </FormLabel>
  
  <InputGroup>
    <Input
      value={value}
      onChange={handleInputChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder="Introduceți adresa completă..."
      // ... alte props
    />
    <InputRightElement>
      {loading ? (
        <Spinner size="sm" />
      ) : value ? (
        <IconButton
          icon={<FiX />}
          onClick={handleClear}
          // ... alte props
        />
      ) : (
        <Icon as={FiSearch} />
      )}
    </InputRightElement>
  </InputGroup>

  {/* Dropdown cu sugestii */}
  {isOpen && suggestions.length > 0 && (
    <Portal>
      <Box position="fixed" zIndex={9999}>
        <List>
          {suggestions.map((suggestion) => (
            <ListItem
              key={suggestion.place_id}
              onClick={() => handleSuggestionClick(suggestion)}
              // ... styling
            >
              <HStack>
                <Icon as={FiMapPin} />
                <VStack align="start">
                  <Text>{suggestion.display_name}</Text>
                  <Badge>{suggestion.type}</Badge>
                </VStack>
              </HStack>
            </ListItem>
          ))}
        </List>
      </Box>
    </Portal>
  )}
</FormControl>
```

## 🔒 Considerații de Securitate și Performanță

### 1. Rate Limiting
- **Nominatim** are limitări de rate (1 request/sec per IP)
- Implementează debouncing (200ms) pentru a reduce numărul de request-uri
- Consideră caching pentru rezultate frecvente

### 2. User-Agent
- **Obligatoriu** să incluzi un User-Agent valid
- Format recomandat: `YourApp-Name/Version`

### 3. Error Handling
```typescript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
} catch (error) {
  console.error('Error fetching suggestions:', error);
  // Show user-friendly error message
}
```

### 4. Validation
```typescript
// Validare input
if (!input || input.length < 2) return;

// Validare coordonate
if (selectedCoordinates && 
    !isNaN(parseFloat(selectedCoordinates.lat)) && 
    !isNaN(parseFloat(selectedCoordinates.lon))) {
  // Coordonate valide
}
```

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile */
@media (max-width: 768px) {
  .location-dropdown {
    width: 100%;
    max-height: 200px;
  }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  .location-dropdown {
    width: 80%;
  }
}

/* Desktop */
@media (min-width: 1025px) {
  .location-dropdown {
    width: 400px;
  }
}
```

## 🧪 Testing

### Test Cases
1. **Căutare cu 2+ caractere** - Verifică că se fac request-uri
2. **Căutare cu <2 caractere** - Verifică că nu se fac request-uri
3. **Selectare sugestie** - Verifică că se salvează adresa și coordonatele
4. **Eroare API** - Verifică handling-ul erorilor
5. **Debouncing** - Verifică că nu se fac request-uri multiple rapid
6. **Click outside** - Verifică că dropdown-ul se închide

### Mock pentru Testing
```typescript
// Mock pentru API calls
jest.mock('fetch', () => {
  return jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          place_id: 123,
          display_name: "Test Location, Romania",
          lat: "44.1234",
          lon: "28.5678",
          type: "building"
        }
      ])
    })
  );
});
```

## 🚀 Optimizări

### 1. Caching
```typescript
const cache = new Map();

const fetchWithCache = async (query: string) => {
  if (cache.has(query)) {
    return cache.get(query);
  }
  
  const result = await fetchSuggestions(query);
  cache.set(query, result);
  return result;
};
```

### 2. Lazy Loading
```typescript
// Încarcă sugestiile doar când input-ul este focus
const handleFocus = () => {
  if (value.length >= 2) {
    fetchSuggestions(value);
  }
};
```

### 3. Virtual Scrolling (pentru liste mari)
```typescript
// Pentru liste cu multe rezultate
import { FixedSizeList as List } from 'react-window';

const VirtualizedSuggestions = ({ suggestions }) => (
  <List
    height={300}
    itemCount={suggestions.length}
    itemSize={50}
  >
    {({ index, style }) => (
      <div style={style}>
        <SuggestionItem suggestion={suggestions[index]} />
      </div>
    )}
  </List>
);
```

## 📋 Checklist Implementare

- [ ] **Setup API calls** cu parametrii corecți
- [ ] **Implementare debouncing** (200ms)
- [ ] **State management** pentru sugestii și loading
- [ ] **Event handlers** pentru input și click
- [ ] **Error handling** cu mesaje user-friendly
- [ ] **Validation** pentru input și coordonate
- [ ] **Responsive design** pentru mobile/tablet/desktop
- [ ] **Accessibility** (ARIA labels, keyboard navigation)
- [ ] **Testing** pentru toate cazurile de utilizare
- [ ] **Performance optimization** (caching, lazy loading)
- [ ] **User-Agent** setat corect
- [ ] **Rate limiting** respectat

## 🔗 Resurse Utile

- [Nominatim API Documentation](https://nominatim.org/release-docs/latest/api/Overview/)
- [OpenStreetMap Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
- [Chakra UI Components](https://chakra-ui.com/docs/components)
- [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)

## 💡 Tips și Tricks

1. **Folosește debouncing** pentru a evita request-uri excesive
2. **Include User-Agent** pentru a respecta ToS
3. **Implementează error handling** robust
4. **Testează pe dispozitive mobile** pentru UX optim
5. **Consideră caching** pentru performanță
6. **Validează coordonatele** înainte de salvare
7. **Folosește Portal** pentru dropdown-uri care depășesc container-ul
8. **Implementează keyboard navigation** pentru accesibilitate

---

**Notă**: Această implementare folosește serviciul gratuit Nominatim. Pentru aplicații cu trafic mare, consideră servicii comerciale precum Google Places API sau Mapbox Geocoding API. 

## 🏆 **API-uri Valide pentru Localități România:**

### **1. 🥇 NOMINATIM (Cel pe care îl folosești deja)**
```
<code_block_to_apply_changes_from>
```
**Status:** ✅ Funcționează (îl folosești deja)
**Gratuit:** ✅ Da
**Limitări:** 1 request/sec

### **2. 🥈 GOOGLE PLACES API**
```
URL: https://maps.googleapis.com/maps/api/place/autocomplete/json
```
**Status:** ✅ Funcționează
**Cost:** €5 per 1000 requests
**Precizie:** Foarte bună

### **3. 🥉 MAPBOX PLACES API**
```
URL: https://api.mapbox.com/geocoding/v5/mapbox.places
```
**Status:** ✅ Funcționează
**Gratuit:** 100,000 requests/lună
**Precizie:** Bună

##  **Recomandarea Mea Realistă:**

### **Opțiunea 1: Rămâi cu Nominatim (Cel mai simplu)**

```typescript
const searchLocalitati = async (input: string) => {
  if (input.length < 3) return [];
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&addressdetails=1&limit=10&countrycodes=ro&accept-language=ro`,
      {
        headers: {
          'Accept-Language': 'ro',
          'User-Agent': 'YourApp/1.0'
        }
      }
    );
    
    const data = await response.json();
    
    // Filtrează doar localitățile (orașe, comune, sate)
    return data
      .filter((item: any) => 
        item.type === 'city' || 
        item.type === 'town' || 
        item.type === 'village' ||
        item.type === 'administrative'
      )
      .map((item: any) => ({
        name: item.display_name.split(',')[0], // Primul element e numele localității
        county: item.address?.state || item.address?.county,
        fullAddress: item.display_name
      }));
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};
```

### **Opțiunea 2: Baza de Date Locală (Cea mai sigură)**

```typescript
// Creezi un fișier cu toate localitățile României
const LOCALITATI_ROMANIA = {
  "Dăbuleni": { judet: "DJ", judetName: "Dolj" },
  "Craiova": { judet: "DJ", judetName: "Dolj" },
  "București": { judet: "B", judetName: "București" },
  "Cluj-Napoca": { judet: "CJ", judetName: "Cluj" },
  "Timișoara": { judet: "TM", judetName: "Timiș" },
  "Iași": { judet: "IS", judetName: "Iași" },
  "Constanța": { judet: "CT", judetName: "Constanța" },
  "Brașov": { judet: "BV", judetName: "Brașov" },
  // ... adaugi toate localitățile
};

const searchLocalitatiLocal = (input: string) => {
  if (input.length < 3) return [];
  
  return Object.entries(LOCALITATI_ROMANIA)
    .filter(([localitate]) => 
      localitate.toLowerCase().includes(input.toLowerCase())
    )
    .map(([localitate, data]) => ({
      name: localitate,
      county: data.judet,
      countyName: data.judetName
    }))
    .slice(0, 10);
};
```

##  **Implementare Completă cu Nominatim:**

```typescript
const LocalitateAutocomplete = ({ onSelect }: { onSelect: (localitate: string, judet: string) => void }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchLocalitati = useCallback(
    debounce(async (input: string) => {
      if (input.length < 3) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&addressdetails=1&limit=10&countrycodes=ro&accept-language=ro`,
          {
            headers: {
              'Accept-Language': 'ro',
              'User-Agent': 'YourApp/1.0'
            }
          }
        );
        
        const data = await response.json();
        
        // Extrage doar localitățile
        const localitati = data
          .filter((item: any) => 
            item.type === 'city' || 
            item.type === 'town' || 
            item.type === 'village' ||
            item.type === 'administrative'
          )
          .map((item: any) => ({
            name: item.display_name.split(',')[0],
            county: item.address?.state || item.address?.county,
            fullAddress: item.display_name
          }));
        
        setSuggestions(localitati);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const handleInputChange = (value: string) => {
    setInput(value);
    searchLocalitati(value);
  };

  const handleSelect = (suggestion: any) => {
    onSelect(suggestion.name, suggestion.county);
    setInput(suggestion.name);
    setSuggestions([]);
  };

  return (
    <div>
      <input
        value={input}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Scrie localitatea (minim 3 litere)..."
      />
      
      {loading && <div>Se caută...</div>}
      
      {suggestions.length > 0 && (
        <ul>
          {suggestions.map((suggestion, index) => (
            <li 
              key={index}
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion.name}, {suggestion.county}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

**Care opțiune preferi?** Nominatim (care funcționează) sau baza de date locală (cea mai sigură)? 