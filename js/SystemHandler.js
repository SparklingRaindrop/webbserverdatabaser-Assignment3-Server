const Message = require("./Message");
const Room = require("./Room");
const User = require("./User");

class SystemHandler {
    constructor(io) {
        this.roomList = {
            default: new Room('default'),
        };
        this.connectedUsers = [];
        this.io = io;
    }

    addNewUser(socket, userName) {
        const newUser = new User(userName, socket.id, this.roomList.default);
        socket.user = newUser;
        socket.join('default');
        this.connectedUsers.push(newUser);
        socket.emit('user_initialized', newUser.getState());
    }

    createNewRoom(name) {
        this.roomList[name] = new Room(roomName);
        return name;
    }

    notifyAll(event, data) {
        this.io.emit(event, data);
    }
    findUserById(id) {
        return this.connectedUsers.find(user => user.socketId === id);
    }
    handleIncomingMsg(socket, data) {
        if (!data || !data.message) {
            return {
                message: 'Your message was rejected by server because it had no content.',
                status: 400,
            };
        }

        const { message, receiver } = data;
        const sender = socket.user;
        const incomingMessage = new Message({
            content: message,
            sender: sender,
            receiver: this.findUserById(receiver),
        });
        console.log('\x1b[35m%s\x1b[0m',
            `ID: ${sender.socketId} has sent "${message}" ` +
            `to ${receiver ? receiver.socketId : sender.currentRoom.name }`
        );

        if (!receiver) {
            socket.to(sender.currentRoom.name).emit('new_msg', incomingMessage.toObj());
        }

        return {status: 200};
    }

}

module.exports = SystemHandler;