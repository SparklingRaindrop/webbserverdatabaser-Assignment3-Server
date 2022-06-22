const Message = require("./Message");
const Room = require("./Room");
const User = require("./User");

class EventHandler {
    constructor(io) {
        this.io = io;
        this.userDict = {};
        this.roomDict = {
            lobby: new Room({
                name: 'lobby',
                createdBy: { name: 'server' }
            }),
        };
    }

    handleReady(socket, userName) {
        const newUser = new User({
            userName,
            socketId: socket.id
        });
        // Add new user to the list. Key = socket ID
        this.userDict[socket.id] = newUser;
        // Using this in middleware
        socket.user = newUser;
        
        newUser.join(this.roomDict.lobby);
        this.roomDict.lobby.addMember(newUser);

        socket.emit('user_initialized', {
            user: {
                ...this.getUserState(newUser.socketId)
            },
            roomList: this.getRoomList(),
        });
        this.notifyAll('new_client', `${userName} has joined`);
        return {
            status: 200
        }
    }

    getUserState(id) {
        const currentRoom = this.getCurrentRoomByUserId(id).toObj();
        return {
            user: this.userDict[id].getState(),
            current: currentRoom,
        }
    }

    getCurrentRoomByUserId(id) {
        let result;
        for (const room in this.roomDict){
            const memberList = this.roomDict[room].getMembers();
            if(memberList.some(member => member.socketId === id)) {
                result = this.roomDict[room];
                break;
            }
        }
        return result;
    }

    createNewRoom(name, createdBy) {
        this.roomDict[name] = new Room({name, createdBy});
        return this.roomDict[name];
    }

    notifyAll(event, data) {
        this.io.emit(event, data);
    }

    getUserById(id) {
        return this.connectedUsers[id];
    }

    getRoomList() {
        const roomList = Object.keys(this.roomDict);
        const result = roomList.map(room => this.roomDict[room].toObj());
        return result;
    }

    handleIncomingMsg(id, data) {
        if (!data || !data.message) {
            return {
                message: 'Your message was rejected by server because it had no content.',
                status: 400,
            };
        }

        const { message, receiver } = data;
        const sender = this.getUserById(id);
        const incomingMessage = new Message({
            content: message,
            sender: sender,
            receiver: this.getUserById(receiver),
        });
        console.log('\x1b[35m%s\x1b[0m',
            `ID: ${sender.getSocketId()} has sent "${message}" ` +
            `to ${receiver ? receiver.getSocketId() : sender.getCurrentRoom().getName() }`
        );
        if (!receiver) {
            this.io.in(sender.getCurrentRoom().getName()).emit('new_msg', incomingMessage.toObj());
            //socket.to(sender.getCurrentRoom()).emit('new_msg', incomingMessage.toObj());
        } else {
            socket.to(receiver.getSocketId()).emit('new_msg', incomingMessage.toObj());
        }
        
        return {status: 200};
    }

    handleJoinRoom(socketId, roomName) {
        const targetUser = this.connectedUsers[socketId];
        const oldRoom = this.getCurrentRoomByUserId(targetUser.getSocketId());
        if (this.roomDict.hasOwnProperty(roomName)) {
            this.roomDict[roomName].addMember(this.connectedUsers[socketId]);
            console.log('\x1b[34m%s\x1b[0m', `ID: ${socketId} entered the room "${roomName}"`);
        } else {
            const newRoom = this.createNewRoom(roomName, targetUser);
            newRoom.addMember(targetUser);
            oldRoom.removeMember(targetUser);
            this.notifyAll('notify_new_room', {
                roomList: this.getRoomList(),
            });
            console.log('\x1b[34m%s\x1b[0m', `ID: ${socketId} created a new room "${roomName}"`);
        }

        targetUser.leave(targetUser.getCurrentRoom());
        targetUser.join(this.roomDict[roomName]); 
        return {
            status: 200,
        }
    }

    handleDisconnect(id) {
        // Remove from room
        this.getCurrentRoomByUserId(id).removeMember(this.connectedUsers[id]);
        // Remove user from the list
        delete this.connectedUsers[id];
    }
}

module.exports = EventHandler;