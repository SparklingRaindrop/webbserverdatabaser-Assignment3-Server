/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    knex.schema.createTable('User', (table) => {
        table.string('id').unique().notNullable();
        table.string('user_name').unique().notNullable();
        table.string('email').unique().notNullable();
        table.string('password').notNullable();
    });
    knex.schema.createTable('Messages', (table) => {
        table.string('id').increments();
        table.foreign('user_name').references('User.id').onDelete('CASCADE');
        table.foreign('room_id').references('Room.id').onDelete('CASCADE');
        table.string('password').notNullable();
    });
    knex.schema.createTable('User', (table) => {
        table.string('id').unique().notNullable();
        table.text('content').notNullable();
        table.integer('room_id')
        table.string('user_id').notNullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
