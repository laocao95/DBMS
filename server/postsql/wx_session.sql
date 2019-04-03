CREATE TABLE wx_session(
    openid VARCHAR (50) PRIMARY KEY,
    user_key VARCHAR (50) NOT NULL,
    session_key VARCHAR (50) NOT NULL,
    name VARCHAR (35),
    phone varchar(20),
    timestamp TIMESTAMP NOT NULL
);
CREATE INDEX wx_user_key_index ON wx_session (user_key);