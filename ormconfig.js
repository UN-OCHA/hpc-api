module.exports = {
    "type": "postgres",
    host: process.env.DEV_DB_HOST,
    port:  5432,
    username: "demo", 
    password: "demo", 
    database: "demo",
    "synchronize": false,
    "logging": false,
    "entities": [
       "src/models/*.ts"
    ],
    "migrations": [
       "src/migration/**/*.ts"
    ],
    "subscribers": [
       "src/subscriber/**/*.ts"
    ],
    "cli": {
       "entitiesDir": "src/models",
       "migrationsDir": "src/migration",
       "subscribersDir": "src/subscriber"
    }
 }