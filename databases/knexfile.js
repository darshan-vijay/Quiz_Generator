module.exports = {
    client: "postgresql",
    connection: () => ({
        connectionString: process.env.DATABASE_URL,
    }),
    migrations: {
        "directory": "./migrations",
        "tableName": "knex_migrations",
    }
}
