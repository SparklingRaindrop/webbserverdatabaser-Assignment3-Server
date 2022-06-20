const config = require("./knexfile");
const knex = require("knex");
const db = knex(config[process.env.KNEX_CONFIG]);

module.exports = db;