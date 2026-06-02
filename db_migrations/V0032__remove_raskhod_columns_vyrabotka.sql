UPDATE t_p56096254_dashboard_creation_p.dashboards
SET columns = '[
  {"key": "plan",              "label": "План"},
  {"key": "fact",              "label": "Факт"},
  {"key": "plan_uk",           "label": "План УК"},
  {"key": "vyrabotka_na_20e",  "label": "Выработка на 20-е"}
]'::jsonb
WHERE id = 6;