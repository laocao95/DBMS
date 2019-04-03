CREATE TABLE teacher(
    teacher_id serial PRIMARY KEY,
    teacher_name VARCHAR (20) NOT NULL,
    teacher_phone varchar(20),
    teacher_pic varchar(50) NOT NULL,
    teacher_logo varchar(50) NOT NULL,
    teacher_description VARCHAR (200),
    teacher_skill VARCHAR (50) NOT NULL,
    teacher_certificate VARCHAR (200)
);