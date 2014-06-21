cassandra schema

conditional statements:
http://www.datastax.com/documentation/cql/3.1/cql/cql_reference/batch_r.html?scroll=reference_ds_djf_xdd_xj__batch-conditional

CREATE KEYSPACE IF NOT EXISTS "test" WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};
use test;
CREATE TABLE IF NOT EXISTS purchases (user text PRIMARY KEY, balance int, expense_id int, amount int, description text, paid boolean);
BEGIN BATCH
INSERT INTO purchases (user, balance) VALUES ('user1', -8) IF NOT EXISTS;
INSERT INTO purchases (user, expense_id, amount, description, paid) VALUES ('user1', 1, 8, 'burrito', false);
APPLY BATCH;
select * from purchases;
BEGIN BATCH
UPDATE purchases SET balance = -208 WHERE user='user1' IF balance = -9;
INSERT INTO purchases (user, expense_id, amount, description, paid)
VALUES ('user1', 2, 200, 'hotel room', false);
APPLY BATCH;
select * from purchases; 

cqlsh:test> CREATE KEYSPACE IF NOT EXISTS "test"
        ...     WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};
cqlsh:test> use test ;
cqlsh:test> BEGIN BATCH
        ...   INSERT INTO purchases (user, balance) VALUES ('user1', -8) IF NOT EXISTS;
        ...   INSERT INTO purchases (user, expense_id, amount, description, paid) VALUES ('user1', 1, 8, 'burrito', false);
        ... APPLY BATCH;

 [applied]
-----------
      True

cqlsh:test> select * from purchases;

 user  | amount | balance | description | expense_id | paid
-------+--------+---------+-------------+------------+-------
 user1 |      8 |      -8 |     burrito |          1 | False

(1 rows)

cqlsh:test> 
cqlsh:test> BEGIN BATCH
        ...   UPDATE purchases SET balance = -208 WHERE user='user1' IF balance = -9;
        ...   INSERT INTO purchases (user, expense_id, amount, description, paid)
        ...     VALUES ('user1', 2, 200, 'hotel room', false);
        ... APPLY BATCH;

 [applied] | user  | balance
-----------+-------+---------
     False | user1 |      -8

cqlsh:test> select * from purchases;                                            
 user  | amount | balance | description | expense_id | paid
-------+--------+---------+-------------+------------+-------
 user1 |      8 |      -8 |     burrito |          1 | False

(1 rows)
