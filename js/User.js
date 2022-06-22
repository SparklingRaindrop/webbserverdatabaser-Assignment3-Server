class User {
    constructor(userName, id, currentRoom) {
        this.socketId = id;
        this.currentRoom = currentRoom;
        // Default name
        this.name = userName;
    }
    getState() {
        return {...this}
    }
}

module.exports = User;