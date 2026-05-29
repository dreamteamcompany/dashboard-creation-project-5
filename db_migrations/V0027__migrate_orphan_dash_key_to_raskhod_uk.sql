-- Перенос значений из старого ключа "-" в raskhod_uk (если raskhod_uk пустой)
UPDATE t_p56096254_dashboard_creation_p.dashboard_rows
SET data = (data - '-') || jsonb_build_object(
  'raskhod_uk',
  CASE WHEN COALESCE((data->>'raskhod_uk')::numeric, 0) = 0
       THEN COALESCE((data->>'-')::numeric, 0)
       ELSE (data->>'raskhod_uk')::numeric END
)
WHERE dashboard_id = 6
  AND data ? '-';