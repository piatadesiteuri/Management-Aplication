-- Adaugă view-urile lipsă pentru sistemul de trasabilitate

-- View pentru trasabilitatea evenimentelor de transport
CREATE OR REPLACE VIEW transport_event_traceability AS
SELECT 
    ce.id as event_id,
    ce.title,
    ce.start_time,
    ce.end_time,
    ce.type as event_type,
    ce.status as event_status,
    ce.created_at as event_created_at,
    
    -- Creator
    creator.id as creator_id,
    creator.first_name as creator_first_name,
    creator.last_name as creator_last_name,
    creator.email as creator_email,
    
    -- Metadata
    ce.metadata,
    
    -- Cerere de materiale asociată
    mr.id as material_request_id,
    mr.request_number,
    p.name as product_name,
    mr.quantity_requested,
    mr.quantity_approved,
    
    -- Audit trail
    (SELECT COUNT(*) FROM transport_event_audit tea WHERE tea.event_id = ce.id) as audit_entries_count,
    (SELECT MAX(tea.performed_at) FROM transport_event_audit tea WHERE tea.event_id = ce.id) as last_audit_at
    
FROM calendar_events ce
LEFT JOIN users creator ON ce.user_id = creator.id
LEFT JOIN supply_events se ON ce.id = se.event_id
LEFT JOIN material_requests mr ON se.request_id = mr.id
LEFT JOIN products p ON mr.product_id = p.id
WHERE ce.type IN ('TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP', 'SUPPLY_ORDER');

-- View pentru statistici de trasabilitate
CREATE OR REPLACE VIEW traceability_statistics AS
SELECT 
    'MATERIAL_REQUESTS' as entity_type,
    COUNT(*) as total_entities,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_7_days,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as last_30_days
FROM material_requests

UNION ALL

SELECT 
    'TRANSPORT_EVENTS' as entity_type,
    COUNT(*) as total_entities,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_7_days,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as last_30_days
FROM calendar_events 
WHERE type IN ('TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP', 'SUPPLY_ORDER')

UNION ALL

SELECT 
    'AUDIT_ENTRIES' as entity_type,
    COUNT(*) as total_entities,
    COUNT(CASE WHEN action_type = 'CREATED' THEN 1 END) as pending_count,
    COUNT(CASE WHEN action_type = 'APPROVED' THEN 1 END) as approved_count,
    COUNT(CASE WHEN action_type = 'REJECTED' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN performed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_7_days,
    COUNT(CASE WHEN performed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as last_30_days
FROM material_request_audit

UNION ALL

SELECT 
    'TRANSPORT_AUDIT_ENTRIES' as entity_type,
    COUNT(*) as total_entities,
    COUNT(CASE WHEN action_type = 'CREATED' THEN 1 END) as pending_count,
    COUNT(CASE WHEN action_type = 'DELIVERED' THEN 1 END) as approved_count,
    COUNT(CASE WHEN action_type = 'CANCELLED' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN performed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_7_days,
    COUNT(CASE WHEN performed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as last_30_days
FROM transport_event_audit;
