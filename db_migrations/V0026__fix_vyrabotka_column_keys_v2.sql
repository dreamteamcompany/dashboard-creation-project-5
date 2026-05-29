UPDATE t_p56096254_dashboard_creation_p.dashboards
SET columns = '[
  {"key": "plan",         "label": "План"},
  {"key": "fact",         "label": "Факт"},
  {"key": "plan_uk",      "label": "План УК"},
  {"key": "raskhod_uk",   "label": "Расхождение УК"},
  {"key": "raskhod_city", "label": "Расхождение города"}
]'::jsonb
WHERE id = 6;