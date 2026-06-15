-- Добавляем города Волгоград и Иркутск в дашборды "Выработка" (id=6) и "Ошибки клиники" (id=8)

-- Дашборд 6 "Выработка": 12 строк (по месяцам) на каждый город с нулевыми значениями
INSERT INTO t_p56096254_dashboard_creation_p.dashboard_rows (dashboard_id, city, data)
SELECT 6, c.name || ' — ' || m.month,
  '{"fact":0,"fakt":0,"plan":0,"plan_uk":0,"raskhod_uk":0,"raskhod_city":0,"vyrabotka_na_20e":0,"rashozhdenie_goroda":0}'::jsonb
FROM (VALUES ('Волгоград'), ('Иркутск')) AS c(name)
CROSS JOIN (VALUES
  ('Январь'),('Февраль'),('Март'),('Апрель'),('Май'),('Июнь'),
  ('Июль'),('Август'),('Сентябрь'),('Октябрь'),('Ноябрь'),('Декабрь')
) AS m(month);

-- Дашборд 8 "Ошибки клиники": итоговая строка (без месяца) + 12 месяцев на город, c1..c12 = 0
INSERT INTO t_p56096254_dashboard_creation_p.dashboard_rows (dashboard_id, city, data)
SELECT 8,
  CASE WHEN m.month = '' THEN c.name ELSE c.name || ' — ' || m.month END,
  '{"c1":0,"c2":0,"c3":0,"c4":0,"c5":0,"c6":0,"c7":0,"c8":0,"c9":0,"c10":0,"c11":0,"c12":0}'::jsonb
FROM (VALUES ('Волгоград'), ('Иркутск')) AS c(name)
CROSS JOIN (VALUES
  (''),
  ('Январь'),('Февраль'),('Март'),('Апрель'),('Май'),('Июнь'),
  ('Июль'),('Август'),('Сентябрь'),('Октябрь'),('Ноябрь'),('Декабрь')
) AS m(month);