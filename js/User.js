class User {
    constructor({userName, socket, currentRoom}) {
        this.name = userName;
        this.socket = socket;
        this.currentRoom = currentRoom;
    }
    leave(room) {
        this.currentRoom = null;
        this.socket.leave(room.getName());
        console.log('On leave', this.socket.rooms);
    }
    join(room) {
        this.currentRoom = room;
        this.socket.join(room.getName());
        console.log('On Join', this.socket.rooms, this.currentRoom.getName());
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