-- Fix duplicate column keys for dashboard id=8 "Ошибки клиники"
-- Old keys collided (--, ---, -, ------00) because of broken slugify on Cyrillic labels.
-- Assign unique keys c1..c12 matching column order, and rebuild row data with those keys.

UPDATE t_p56096254_dashboard_creation_p.dashboards
SET columns = '[
  {"key": "c1",  "type": "Сервис",      "label": "Открытие старых периодов"},
  {"key": "c2",  "type": "Сервис",      "label": "Списание не тех позиций"},
  {"key": "c3",  "type": "Сервис",      "label": "Не списали вовремя"},
  {"key": "c4",  "type": "Сервис",      "label": "Неправильное оформление замен (Гарантия, бонус, замена 0в0)"},
  {"key": "c5",  "type": "Сервис",      "label": "Выявленные ошибки УК"},
  {"key": "c6",  "type": "Сервис",      "label": "Несоблюдение дедлайнов"},
  {"key": "c7",  "type": "Фин",         "label": "Открытие старых периодов"},
  {"key": "c8",  "type": "Фин",         "label": "Выявленные ошибки УК"},
  {"key": "c9",  "type": "Фин",         "label": "Несоблюдение дедлайнов"},
  {"key": "c10", "type": "Бухгалтерия", "label": "Открытие старых периодов"},
  {"key": "c11", "type": "Бухгалтерия", "label": "Выявленные ошибки УК"},
  {"key": "c12", "type": "Бухгалтерия", "label": "Несоблюдение дедлайнов"}
]'::jsonb
WHERE id = 8;

-- Rebuild every row's data with the new unique keys, all values 0
UPDATE t_p56096254_dashboard_creation_p.dashboard_rows
SET data = '{"c1":0,"c2":0,"c3":0,"c4":0,"c5":0,"c6":0,"c7":0,"c8":0,"c9":0,"c10":0,"c11":0,"c12":0}'::jsonb
WHERE dashboard_id = 8;