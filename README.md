# Morag
Morag- name derived from a Celestial Star used for sailors as a guiding star. 
This service is made to be self dependent which can support multiple database. Currently supporting Postgres

# Structure
There is a query_builder file for oracle(query_builder.js) and postgres(query_builder_postgres.js), where the sql transactions and result extractions are executed

## SQL Query Usage
SQL Queries can be used with binds(no postion constraint in place) with in the following format for different DBs

- Oracle: 
    > SELECT * FROM tablename WHERE id = :id

    > INSERT INTO tablename (id, name, default_value) VALUES(:id, :name, :default_value)

    > DELETE FROM tablename WHERE id = :id

- Postgres: 
    > SELECT * FROM tablename WHERE id = $id

    > INSERT INTO tablename (id, name, default_value) VALUES($id, $name, $default_value)
     
    > DELETE FROM tablename WHERE id = $id