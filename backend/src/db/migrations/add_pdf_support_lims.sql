-- Adaugă câmp pentru PDF-uri în analysis_request_tests
ALTER TABLE analysis_request_tests
ADD COLUMN result_pdf_path VARCHAR(500) NULL AFTER result_interpretation,
ADD COLUMN result_pdf_filename VARCHAR(255) NULL AFTER result_pdf_path;
