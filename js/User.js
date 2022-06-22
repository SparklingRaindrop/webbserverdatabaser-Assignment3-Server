class User {
    constructor(name, socketId, room) {
        this.name = name;
        this.socketId = socketId;
        this.currentRoom = room;
    }
}

module.exports = User;