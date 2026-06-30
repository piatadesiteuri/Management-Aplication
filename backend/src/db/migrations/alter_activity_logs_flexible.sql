-- Face audit-ul extensibil (pentru module noi, inclusiv Registratură)
-- În schema inițială, activity_logs.action_type și entity_type sunt ENUM-uri -> blochează acțiuni noi.
-- Convertim la VARCHAR ca să fie "future-proof" și să nu mai pice logarea.

ALTER TABLE activity_logs
  MODIFY COLUMN action_type VARCHAR(64) NOT NULL,
  MODIFY COLUMN entity_type VARCHAR(64) NOT NULL;




