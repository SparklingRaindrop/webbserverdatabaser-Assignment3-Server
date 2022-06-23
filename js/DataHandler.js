const db = require('../config/database');

class DataHandler {
    constructor(){
        this.createNewRoom(process.env.DEFAULT_ROOM_NAME);
    }

    async createNewRoom(newRoomName) {
        const query = 
            'INSERT INTO Room (name)' +
            `VALUES ($name);`;
    
        return new Promise ((resolve, reject) => {
            db.run(query, {
                $name: newRoomName
            }, (error) => {
                if (error) {
                    console.error(error.message);
                    reject(error);
                }
                resolve();
            });
        }).then(() =>  {
            return new Promise(function(resolve, reject) {
                db.get(`SELECT * FROM Room WHERE name = $newRoomName;`,{
                    $newRoomName: newRoomName
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
    
    async addNewUser(newUser) {
        const { parameters } = this.generateParams(newUser);
        const query = 
            'INSERT INTO User (id, name, current_room)' +
            `VALUES ($id, $name, $current_room);`;
    
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
                db.get(`SELECT * FROM User WHERE id = $id`, {$id: newUser.id}, (error, row) => {
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
        return new Promise(function(resolve, reject) {
            db.get(`SELECT * FROM User WHERE id = $id`, {
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
        return new Promise(function(resolve, reject) {
            db.all(`SELECT * FROM Room`, (error, row) => {
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
            db.get(`Delete FROM User WHERE id = $id`, {
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
        const { parameters } = this.generateParams(newMessage);
        const query = 
            'INSERT INTO Message (sender, receiver, room_name, content, timestamp)' +
            'VALUES ($sender, $receiver, $room_name, $content, $timestamp);';
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

    moveRoom({id, to}) {
        const query = 
            'UPDATE User SET current_room = $current_room WHERE id = $id;'
        return new Promise ((resolve, reject) => {
            db.run(query, {
                $id: id,
                $current_room: to
            }, (error) => {
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
            result += `${result !== '' ? ', ' : ''}${key} = $${key}`;
            return result;
        }, '');
    
        const parameters = {...newDataObj};
        for (const property in newDataObj) {
            parameters[`$${property}`] = newDataObj[property];
            delete parameters[property];
        }
    
        return {
            targets,
            parameters
        };
    }

    
}


module.exports = DataHandler;