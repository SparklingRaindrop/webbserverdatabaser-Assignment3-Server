/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: 'db.sqlite3',
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    useNullAsDefault: true
  },
};
