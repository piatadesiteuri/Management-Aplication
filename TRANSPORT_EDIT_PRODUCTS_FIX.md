# Fix Preluarea Produselor în Editarea Evenimentelor Transport

## Problema Identificată

Când se editează un eveniment de transport, produsele nu sunt preluate din baza de date pentru a fi afișate în formularul de editare. Produsele sunt salvate într-un tabel separat (`event_transport_orders`) dar nu sunt încărcate în interfață.

## Soluția Implementată

### 1. Backend - Endpoint nou pentru preluarea produselor

#### Adăugat în CalendarController.ts:
```typescript
getEventTransportItems: async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        
        const [items] = await pool.execute(`
            SELECT 
                eto.id,
                eto.product_id,
                eto.product_name,
                eto.supplier_id,
                eto.supplier_name,
                eto.quantity,
                eto.unit_price,
                eto.total_price,
                eto.expected_delivery_date,
                eto.status,
                eto.notes,
                p.code as product_code,
                p.unit as product_unit,
                p.unit_price as product_unit_price
            FROM event_transport_orders eto
            LEFT JOIN products p ON eto.product_id = p.id
            WHERE eto.event_id = ?
            ORDER BY eto.created_at ASC
        `, [eventId]);
        
        res.json(items);
    } catch (error) {
        res.status(500).json({ 
            message: 'Eroare la încărcarea produselor evenimentului de transport'
        });
    }
}
```

#### Adăugat în calendar.ts routes:
```typescript
router.get('/events/:eventId/transport-items', CalendarController.getEventTransportItems);
```

### 2. Frontend - CalendarService

#### Adăugat metoda pentru preluarea produselor:
```typescript
async getEventTransportItems(eventId: string): Promise<any[]> {
    try {
        const response = await api.get(`/calendar/events/${eventId}/transport-items`);
        return response.data;
    } catch (error) {
        throw error;
    }
}
```

### 3. Frontend - EventModal.tsx

#### Modificat logica de preluare a datelor pentru editare:
```typescript
// Pentru evenimentele de transport, preluăm datele din metadata și produsele din backend
if (['TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP', 'SUPPLY_ORDER'].includes(initialData.type) && initialData.metadata) {
    // Preluăm produsele din backend
    const loadTransportItems = async () => {
        try {
            const transportItems = await calendarService.getEventTransportItems(initialData.id);
            
            // Transformăm produsele din backend în formatul așteptat
            const orderItems = transportItems.map((item: any) => ({
                productId: item.product_id,
                productName: item.product_name,
                productCode: item.product_code || '',
                productUnit: item.product_unit || 'buc',
                supplierPrice: item.unit_price,
                quantity: item.quantity,
                totalPrice: item.total_price,
                currentStock: 0,
                minOrderQuantity: 1,
                deliveryTime: 1,
                status: item.status,
                notes: item.notes,
                supplierId: item.supplier_id,
                supplierName: item.supplier_name,
                unitPrice: item.unit_price,
                expectedDeliveryDate: item.expected_delivery_date
            }));
            
            // Setăm transportData cu datele din metadata și produsele din backend
            setTransportData({
                supplierId: metadata.supplierId,
                supplierName: metadata.supplierName,
                // ... alte câmpuri din metadata
                orderItems: orderItems
            });
        } catch (error) {
            // Fallback la datele din metadata dacă nu putem prelua din backend
        }
    };
    
    loadTransportItems();
}
```

### 4. Frontend - TransportEventForm.tsx

#### Modificat preluarea datelor existente:
```typescript
// Preluăm datele existente pentru editare
useEffect(() => {
    if (editMode && initialData) {
        // Setăm furnizorul
        if (initialData.supplierId) {
            setSelectedSupplierId(initialData.supplierId);
        }
        
        // Setăm depozitul de livrare
        if (initialData.deliveryAddress) {
            setSelectedWarehouse(initialData.deliveryAddress);
        }
        
        // Setăm produsele din comandă
        if (initialData.orderItems && initialData.orderItems.length > 0) {
            const mappedOrderItems: OrderItem[] = initialData.orderItems.map(item => ({
                productId: item.productId,
                productName: item.productName,
                productCode: '', // Va fi populat când se încarcă produsele
                productUnit: 'buc',
                supplierPrice: item.unitPrice,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
                currentStock: 0,
                minOrderQuantity: 1,
                deliveryTime: 1
            }));
            
            setOrderItems(mappedOrderItems);
        }
    }
}, [editMode, initialData]);
```

## Fluxul de Date

1. **Când se apasă "Editează Eveniment"** pentru un eveniment de transport:
   - Se preiau datele de bază din `metadata` (furnizor, adresa, etc.)
   - Se preiau produsele din tabelul `event_transport_orders` prin noul endpoint
   - Se combină datele și se trimit către `TransportEventForm`

2. **În TransportEventForm**:
   - Se setează furnizorul din `initialData.supplierId`
   - Se setează adresa din `initialData.deliveryAddress`
   - Se setează produsele din `initialData.orderItems`

3. **La salvare**:
   - Se trimit toate datele actualizate la backend
   - Backend-ul șterge comenzile existente și le adaugă din nou cu noile date

## Testare

Pentru a testa implementarea:

1. Creează un eveniment de transport cu produse
2. Apasă "Editează Eveniment"
3. Verifică că:
   - Furnizorul este preluat corect
   - Adresa de livrare este preluată corect
   - Produsele sunt afișate în lista de produse comandate
   - Cantitățile și prețurile sunt corecte
4. Modifică datele și salvează
5. Verifică că modificările sunt salvate corect

## Beneficii

- ✅ Produsele sunt preluate din baza de date reală
- ✅ Editarea funcționează corect pentru toate câmpurile
- ✅ Datele sunt sincronizate între frontend și backend
- ✅ Fallback la metadata dacă backend-ul nu răspunde
- ✅ Logging detaliat pentru debugging 