UPDATE t_p56096254_dashboard_creation_p.dashboards
SET columns = REPLACE(columns::text, '"Бухгалтерия"', '"Дженерики"')::jsonb
WHERE id = 8 AND columns::text LIKE '%Бухгалтерия%';