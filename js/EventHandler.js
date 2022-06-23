const Message = require("./Message");
const Room = require("./Room");
const User = require("./User");
const DataHandler = require('./DataHandler');

class EventHandler {
    constructor(io) {
        this.io = io;
        this.userDict = {};
        this.dh = new DataHandler();
    }

    async handleReady(socket, userName) {
        const newUser = await this.dh.addNewUser({
            id: socket.id,
            name: userName,
            current_room: 'lobby'
        });
        socket.join('lobby');
        //this.userDict[socket.id] = newUser;

        const roomList = await this.dh.getAllRoom();
        socket.emit('user_initialized', {
            user: newUser,
            roomList: roomList
        });
        this.notifyAll('new_client', `${userName} has joined`);

/*         // Add new user to the list. Key = socket ID
        this.userDict[socket.id] = newUser;
        // Using this in middleware
        socket.user = newUser;
        
        newUser.join(this.roomDict.lobby);
        this.roomDict.lobby.addMember(newUser);

        socket.emit('user_initialized', {
            user: {
                ...this.getUserState(newUser.socket.id)
            },
            roomList: this.getRoomList(),
        });
        this.notifyAll('new_client', `${userName} has joined`); */
        return {
            status: 200
        }
    }

    async handleSendMsg(socket, data) {
        if (!data || !data.message) {
            return {
                status: 400,
                message: 'Your message was rejected by server because it had no content.',
            };
        }

        const { message, receiver } = data;
        const sender = await this.dh.getUserById(socket.id);
        const newMessage = {
            sender: socket.id,
            receiver,
            room_name: sender.current_room,
            content: message,
            timestamp: new Date().toString(),
        };
        await this.dh.addMessage(newMessage)


        console.log('\x1b[35m%s\x1b[0m',
            `ID: ${sender.id} has sent "${message}" ` +
            `to ${receiver ? receiver : sender.current_room }`
        );

        // Group message
        if (!receiver) {
            socket.to(sender.current_room).emit('new_msg', newMessage);
        } else {
            this.io.to(receiver.getSocketId()).emit('new_msg', newMessage);
        }
        
        return {status: 200};
    }

    async handleJoinRoom(socket, newRoomName) {
        const targetUser = await this.dh.getUserById(socket.id);
        const oldRoom = targetUser.current_room;

        // When the room already exists.
        const roomList = await this.dh.getAllRoom();
        if (roomList.filter(room => room.name === newRoomName).length === 0) {
            this.dh.createNewRoom(newRoomName);
            console.log('\x1b[34m%s\x1b[0m', `ID: ${socket.id} created a new room "${newRoomName}"`);
            this.notifyAll('notify_new_room', {
                roomList: await this.dh.getAllRoom(),
            });
        }
        console.log('\x1b[34m%s\x1b[0m', `ID: ${socket.id} entered the room "${newRoomName}"`);
        await this.dh.moveRoom({
            id: socket.id,
            to: newRoomName
        })
        socket.leave(oldRoom);
        socket.join(newRoomName);
        return {
            status: 200,
        }
    }

    async handleTransportClose(id) {
        await this.dh.removeUser(id);
    }

    handleRemoveRoom(socket, data) {

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
            // getMembers() return parsed data arr of obj
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
        return this.userDict[id];
    }

    getRoomList() {
        const roomList = Object.keys(this.roomDict);
        const result = roomList.map(room => this.roomDict[room].toObj());
        return result;
    }

    handleDisconnect(id) {
        // Remove from room
        this.getCurrentRoomByUserId(id).removeMember(this.userDict[id]);
        // Remove user from the list
        delete this.userDIct[id];
    }
}

module.exports = EventHandler;