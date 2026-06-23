UPDATE t_p56096254_dashboard_creation_p.dashboards
SET columns = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements(columns) AS elem
  WHERE NOT (elem->>'key' IN ('c11', 'c12'))
)
WHERE id = 8;