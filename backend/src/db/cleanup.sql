-- Delete old departments that don't have any associated users or events
DELETE FROM departments 
WHERE id IN (1, 2, 3, 4) 
AND id NOT IN (
    SELECT DISTINCT department_id FROM department_users
    UNION
    SELECT DISTINCT department_id FROM calendar_events WHERE department_id IS NOT NULL
); 