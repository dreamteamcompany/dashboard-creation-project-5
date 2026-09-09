INSERT INTO t_p56096254_dashboard_creation_p.dashboard_rows (dashboard_id, city, data)
SELECT 6, 'Саратов — ' || m, '{"plan":0,"fakt":0,"plan_uk":0,"dolgi_klinik":0,"vyrabotka_na_20e":0}'::jsonb
FROM unnest(ARRAY['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']) AS m;

INSERT INTO t_p56096254_dashboard_creation_p.dashboard_rows (dashboard_id, city, data)
SELECT 8, 'Саратов — ' || m, '{"c1":0,"c2":0,"c3":0,"c4":0,"c5":0,"c6":0,"c7":0,"c8":0,"c9":0,"---":0}'::jsonb
FROM unnest(ARRAY['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']) AS m;

INSERT INTO t_p56096254_dashboard_creation_p.dashboard_rows (dashboard_id, city, data)
VALUES (8, 'Саратов', '{"c1":0,"c2":0,"c3":0,"c4":0,"c5":0,"c6":0,"c7":0,"c8":0,"c9":0,"---":0}'::jsonb);
