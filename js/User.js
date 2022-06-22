class User {
    constructor({userName, socketId}) {
        this.name = userName;
        this.socketId = socketId;
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
    getState() {
        return {
            name: this.name,
            socketId: this.socketId,
        };
    }
}

module.exports = User;