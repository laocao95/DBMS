CREATE TABLE customer_order(
    order_id serial PRIMARY KEY,
    booking_num VARCHAR (32) NOT NULL,
    order_time TIMESTAMP NOT NULL,
    curriculum_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    price NUMERIC (7, 2) NOT NULL,
    confirm BOOLEAN NOT NULL
);
CREATE INDEX order_curriculum_id_index ON customer_order (curriculum_id);
CREATE INDEX order_student_id_index ON customer_order (student_id);