CREATE TEMPORARY TABLE temporary_table AS
  SELECT NULL, obj.id as obj_id, o.date as date, o.data as data, reserved FROM objects as obj, orders as o
  WHERE  obj.id=o.obj_id AND (o.data IS NOT NULL OR o.data='')
         AND o.date=(SELECT MAX(date) FROM orders, objects WHERE  orders.obj_id=objects.id AND objects.id=o.obj_id GROUP BY obj_id)
  GROUP BY obj_id
UPDATE temporary_table SET date=NOW() + INTERVAL 1 DAY;
SELECT * FROM temporary_table
# INSERT INTO orders SELECT * FROM temporary_table;