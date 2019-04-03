CREATE TABLE curriculum(
    curriculum_id serial PRIMARY KEY,
    store_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    instrument_type VARCHAR (50) NOT NULL,
    class_type INTEGER NOT NULL,
    class_name VARCHAR (20) NOT NULL,
    class_date Date NOT NULL,
    class_stime TIME NOT NULL,
    class_etime TIME NOT NULL,
    teacher_id INTEGER NOT NULL,
    size INTEGER NOT NULL,
    sold INTEGER NOT NULL,
    price NUMERIC (7, 2) NOT NULL,
    discount NUMERIC (7, 2) NOT NULL
);
CREATE INDEX cur_class_date_index ON curriculum (class_date);
CREATE INDEX cur_store_id_index ON curriculum (store_id);