const db = require('../config/database');

class DataHandler {

    async createNewRoom(newRoom) {
        const {parameters} = this.generateParams(newRoom);
        const query = 
            `INSERT INTO Room (name${newRoom.password ? ', password' : ''}) ` +
            `VALUES($name${newRoom.password ? ', $password' : ''});`;
            //    `VALUES(name = 'Test', password = 'password');`;
    
        return new Promise ((resolve, reject) => {
            db.run(query, parameters, (error) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve();
            });
        }).then(() =>  {
            return new Promise(function(resolve, reject) {
                db.get(`SELECT * FROM Room WHERE name = $newRoomName;`,{
                    $newRoomName: newRoom.name
                }, (error, row) => {
                    if (error) {
                        console.error(error.message);
                        reject(error);
                    }
                    resolve(row);
                });
            });
        });
    }
/* 
    async refreshDB() {
        const query = 'DELETE FROM Room;';
    
        return new Promise ((resolve, reject) => {
            db.run(query, (error) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve();
            });
        }).then(() =>  {
            return new Promise(function(resolve, reject) {
                db.run('DELETE FROM User;', (error, row) => {
                    if (error) {
                        console.error(error.message);
                        reject(error);
                    }
                    resolve(row);
                });
            });
        });
    }
    */ 
    async addNewUser(newUser) {
        const { parameters } = this.generateParams(newUser);
        const query = 
            'INSERT INTO User (id, name, current_room_id)' +
            'VALUES ($id, $name, $current_room_id);';
    
        return new Promise ((resolve, reject) => {
            db.run(query, parameters, (error) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve();
            });
        }).then(() =>  {
            return new Promise(function(resolve, reject) {
                db.get(`SELECT User.*, Room.name AS current_room FROM User INNER JOIN Room ON Room.id = current_room_id WHERE User.id = $id`, {$id: newUser.id}, (error, row) => {
                    if (error) {
                        console.error(error.message);
                        reject(error);
                    }
                    resolve(row);
                });
            });
        });
    }
    
    getUserById(id) {
        const query = 'SELECT User.*, Room.name AS current_room FROM User ' +
            'INNER JOIN Room ON User.current_room_id = Room.id WHERE User.id = $id'
        return new Promise(function(resolve, reject) {
            db.get(query, {
                $id: id
            }, (error, row) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve(row);
            });
        });
    }

    getAllRoom() {
        const query = `SELECT id, name, ` +
            'CASE WHEN password IS NULL THEN 0 ELSE 1 END AS password FROM Room;'
        return new Promise(function(resolve, reject) {
            db.all(query, (error, row) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve(row);
            });
        });
    }

    getRoomBy(params) {
        const {targets, parameters} = this.generateParams(params);
        return new Promise(function(resolve, reject) {
            db.get(`SELECT * FROM Room WHERE ${targets}`, parameters, (error, row) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve(row);
            });
        });
    }

    getRoomIdByRoomName(roomName) {
        return new Promise(function(resolve, reject) {
            db.get(`SELECT id FROM Room WHERE name = $roomName`, {
                $roomName: roomName
            }, (error, row) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve(row);
            });
        });
    }

    getRoomNameById(id) {
        return new Promise(function(resolve, reject) {
            db.get(`SELECT name FROM Room WHERE id = $id`, {
                $id: id
            }, (error, row) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve(row);
            });
        });
    }

    getAllUsers() {
        return new Promise(function(resolve, reject) {
            db.all(`SELECT * FROM User`, (error, row) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve(row);
            });
        });
    }

    getMembersByRoomName(roomName) {
        return new Promise(function(resolve, reject) {
            db.all(`SELECT * FROM User LEFT JOIN Room ON Room.id = current_room_id WHERE Room.name = $roomName`,{
                $roomName: roomName
            }, (error, row) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve(row);
            });
        });
    }

    getMembersByRoomID(id) {
        return new Promise(function(resolve, reject) {
            db.all(`SELECT * FROM User WHERE current_room_id = $id`,{
                $id: id
            }, (error, row) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve(row);
            });
        });
    }
    
    removeUser(id) {
        return new Promise(function(resolve, reject) {
            db.run(`Delete FROM User WHERE id = $id`, {
                $id: id
            }, (error, row) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve(row);
            });
        });
    }

    addMessage(newMessage) {
        const hasReceiver = newMessage.receiver !== undefined;
        const { parameters } = this.generateParams(newMessage);
        const query = 
            `INSERT INTO Message (sender, sender_name, room_id, content, timestamp${hasReceiver ? ', receiver' : ''}) ` +
            `VALUES ($sender, $sender_name, $room_id, $content, $timestamp${hasReceiver ? ', receiver' : ''});`;

        return new Promise ((resolve, reject) => {
            db.run(query, parameters, (error) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve();
            });
        });
    }

    moveRoom({id, newRoomId}) {
        const query = 
            'UPDATE User SET current_room_id = $current_room_id WHERE id = $id;'
        return new Promise ((resolve, reject) => {
            db.run(query, {
                $id: id,
                $current_room_id: newRoomId
            }, (error) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve();
            });
        });
    }

    removeRoom(roomName) {
        return new Promise(function(resolve, reject) {
            db.run(`Delete FROM Room WHERE name = $roomName`, {
                $roomName: roomName
            }, (error, row) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve();
            });
        });
    }

    generateParams(newDataObj) {
        const targets = Object.keys(newDataObj).reduce((result, key) => {
            if (newDataObj[key] !== undefined) {
                result += `${result !== '' ? ', ' : ''}${key} = $${key}`;
            }
            return result;
        }, '');
    
        const parameters = {...newDataObj};
        for (const property in newDataObj) {
            if (newDataObj[property]) {
                parameters[`$${property}`] = newDataObj[property];
            }
            delete parameters[property];
        }
    
        return {
            targets,
            parameters
        };
    }

    
}


module.exports = DataHandler;