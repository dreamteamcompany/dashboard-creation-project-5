UPDATE t_p56096254_dashboard_creation_p.dashboard_rows
SET data = data - 'c11' - 'c12',
    updated_at = now()
WHERE dashboard_id = 8
  AND (data ? 'c11' OR data ? 'c12');