UPDATE extra_tables
SET columns = '[{"key":"col_patient","label":"Пациент"},{"key":"col_plan","label":"План лечения"},{"key":"col_nomenclature","label":"Номенклатура"},{"key":"col_price","label":"Цена"},{"key":"col_discount","label":"Процент снижения","agg":"avg"}]'::jsonb
WHERE id = 2;