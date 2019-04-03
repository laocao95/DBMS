CREATE TABLE class(
    class_id serial PRIMARY KEY,
    class_name VARCHAR (20) NOT NULL,
    instrument_type VARCHAR (50) NOT NULL,
    class_type INTEGER NOT NULL,
    class_description VARCHAR (200),
    class_object VARCHAR (200),
    class_demand VARCHAR (200)
);