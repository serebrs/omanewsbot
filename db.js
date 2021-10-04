exports.localConn = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_DB,
    acquireTimeout: 1000
};

exports.herokuConn = {
    host: process.env.CLEARDB_HOST,
    user: process.env.CLEARDB_USER,
    password: process.env.CLEARDB_PWD,
    database: process.env.CLEARDB_DB,
    acquireTimeout: 1000
};