-- Восстанавливаем правильные ключи колонок (фронтенд снова затёр их на "-")
UPDATE t_p56096254_dashboard_creation_p.dashboards
SET columns = '[
  {"key": "plan",         "label": "План"},
  {"key": "fact",         "label": "Факт"},
  {"key": "plan_uk",      "label": "План УК"},
  {"key": "raskhod_uk",   "label": "Расхождение УК"},
  {"key": "raskhod_city", "label": "Расхождение города"}
]'::jsonb
WHERE id = 6;

-- Переносим осиротевшие значения из "-" в raskhod_uk
UPDATE t_p56096254_dashboard_creation_p.dashboard_rows
SET data = (data - '-') || jsonb_build_object(
  'raskhod_uk',
  CASE WHEN COALESCE((data->>'raskhod_uk')::numeric, 0) = 0
       THEN COALESCE((data->>'-')::numeric, 0)
       ELSE (data->>'raskhod_uk')::numeric END
)
WHERE dashboard_id = 6 AND data ? '-';