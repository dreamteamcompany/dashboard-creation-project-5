UPDATE t_p56096254_dashboard_creation_p.dashboard_rows
SET data = jsonb_set(data, '{fakt}', data->'fact')
WHERE dashboard_id = 6
  AND COALESCE((data->>'fakt')::numeric, 0) = 0
  AND COALESCE((data->>'fact')::numeric, 0) > 0;