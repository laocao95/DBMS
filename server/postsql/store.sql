CREATE TABLE store(
    store_id serial PRIMARY KEY,
    store_name VARCHAR (20) NOT NULL,
    store_place VARCHAR (20) NOT NULL,
    store_pic VARCHAR (200) NOT NULL,
    store_description VARCHAR (200),
    longitude NUMERIC (8, 5),
    latitude NUMERIC (8, 5)
);