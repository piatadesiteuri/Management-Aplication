-- Add location and vehicle_id columns to calendar_events table
ALTER TABLE calendar_events 
ADD COLUMN location VARCHAR(500) NULL,
ADD COLUMN vehicle_id INT NULL;

-- Add index for vehicle_id for better performance
CREATE INDEX idx_calendar_events_vehicle_id ON calendar_events(vehicle_id);

-- Add index for location for better search performance  
CREATE INDEX idx_calendar_events_location ON calendar_events(location); 