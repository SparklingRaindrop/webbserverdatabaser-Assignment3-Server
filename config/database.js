const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./config/db.sqlite', async (error) => {
    if (error) {
        console.error(error.message);
        throw error;
    }

    const userStatement = `
        CREATE TABLE IF NOT EXISTS User (
            id string PRIMARY KEY,
            name TEXT NOT NULL,
            current_room NOT NULL,
            FOREIGN KEY (current_room) REFERENCES Room (id)
        );
    `;

    const roomStatement = `
        CREATE TABLE IF NOT EXISTS Room (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );
    `;

    const messageStatement = `
    CREATE TABLE IF NOT EXISTS Message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender string NOT NULL,
        receiver string,
        room_id INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES Room (id) ON DELETE CASCADE,
        FOREIGN KEY (sender) REFERENCES User (id) ON DELETE CASCADE,
        FOREIGN KEY (receiver) REFERENCES User (id) ON DELETE CASCADE
    );
    `;
    
    [userStatement, roomStatement, messageStatement].forEach(statement => {
        db.run(statement, (error) => {
            if (error) {
                console.error(error.message);
            }
        });
    });
});

module.exports = db;