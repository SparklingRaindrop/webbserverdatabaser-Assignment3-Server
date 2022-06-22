class User {
    constructor(userName, socket) {
        this.socket = socket;
        this.name = userName;
    }
    leave() {
        return (room) => {
            socket.leave(room.getName());
        }
    }
    join() {
        return (room) => {
            this.socket.currentRoom = room;
            socket.join(room.getName());
        }
    }
    getCurrentRoom() {
        return this.currentRoom;
    }
    getSocketId() {
        return this.socket.id;
    }
    getState() {
        return {
            name: this.name,
            socketId: this.socket.id
        };
    }
}

module.exports = User;