class User {
    constructor({userName, socket, currentRoom}) {
        this.name = userName;
        this.socket = socket;
        this.currentRoom = currentRoom;
    }
    leave(room) {
        this.socket.leave(room.getName());
    }
    join(room) {
        this.socket.currentRoom = room;
        this.socket.join(room.getName());
    }
    getCurrentRoom() {
        return this.currentRoom;
    }
    getState() {
        return {
            name: this.name,
            socketId: this.socket.id,
        };
    }
    getSocketId() {
        return this.socket.id;
    }
}

module.exports = User;