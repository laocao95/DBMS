CREATE TABLE student(
    student_id serial PRIMARY KEY,
    store_id Integer NOT NULL,
    student_name VARCHAR (35) NOT NULL,
    student_phone varchar(20),
    openid VARCHAR (50) NOT NULL,
    timestamp TIMESTAMP NOT NULL
);
CREATE INDEX student_openid_index ON student (openid);