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
        this.handleJoinRoom(socket, 'lobby');
        const roomList = await this.getRoomList();
        socket.emit('user_initialized', {
            user: newUser,
            roomList: roomList
        });
        const userList = await this.dh.getAllUsers();
        this.notifyAll('new_client', {
            users: userList,
            message: `${socket.id} has joined`,
        });
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
            sender_name: sender.name,
            receiver,
            room_name: sender.current_room,
            content: message,
            timestamp: new Date().toString(),
        };
        await this.dh.addMessage(newMessage)
            .catch(() => ({
                    status: 500,
                    message: 'Something went wrong on the server.',
            }));

        console.log('\x1b[35m%s\x1b[0m',
            `ID: ${sender.id} has sent "${message}" ` +
            `to ${receiver ? receiver : sender.current_room }`
        );

        // Group message
        if (!receiver) {
            socket.to(sender.current_room).emit('new_msg', newMessage);
        } else {
            this.io.to(receiver).emit('new_msg', newMessage);
        }
        
        return {status: 200};
    }

    async handleCreateRoom(socket, roomName) {
        const roomList = await this.dh.getAllRoom();
        if (roomList.filter(room => room.name === roomName).length === 0) {
            await this.dh.createNewRoom(roomName);
            console.log('\x1b[34m%s\x1b[0m', `ID: ${socket.id} created a new room "${roomName}"`);
            const roomList = await this.getRoomList();
            this.notifyAll('update_room_list', {
                roomList: roomList,
            });
            return {
                status: 200,
            }
        } else {
            return {
                status: 400,
                message: `${roomName} exists. Pick another name`
            }
        }
    }

    async handleJoinRoom(socket, newRoomName) {
        const targetUser = await this.dh.getUserById(socket.id);
        const oldRoom = targetUser.current_room;

        // When the room already exists.
        const roomList = await this.dh.getAllRoom();
        if (roomList.filter(room => room.name === newRoomName).length === 0) {
            return {
                status: 400,
                message: `Room ${newRoomName} doesn't exist.`
            }
        }
        console.log('\x1b[34m%s\x1b[0m', `ID: ${socket.id} entered the room "${newRoomName}"`);
        await this.dh.moveRoom({
            id: socket.id,
            to: newRoomName
        })
        socket.leave(oldRoom);
        socket.join(newRoomName);
        this.io.to(newRoomName).emit('room_new_member', targetUser);
        return {
            status: 200,
        }
    }

    async handleTransportClose(id) {
        await this.dh.removeUser(id);
    }

    async handleRemoveRoom(socket, roomName) {
        if (roomName === 'lobby') {
            return  {
                status: 400,
                message: `Lobby can not be deleted.`
            }
        }
        if (roomName === '') {
            return  {
                status: 400,
                message: `Please provide a room name.`
            }
        }
        const roomList = await this.dh.getAllRoom();
        if (roomList.filter(room => room.name === roomName).length === 0) {
            return {
                status: 400,
                message: `Cannot find room with the name, ${roomName}`
            }
        }
        const members = await this.dh.getMembersByRoomName(roomName)
        const isEmpty = members.length === 0;
        if (!isEmpty) {
            return {
                status: 400,
                message: `Cannot delete room, ${roomName} when there are is somebody.`
            }
        }
        this.dh.removeRoom(roomName);
        console.log('\x1b[34m%s\x1b[0m', `ID: ${socket.id} deleted a room "${roomName}"`);
        this.notifyAll('update_room_list', {
            roomList: await this.getRoomList(),
        });
        return {
            status: 200,
            message: `${roomName} exists. Pick another name`
        }
    }

    async getRoomList() {
        const rooms = await this.dh.getAllRoom();
        const result = await Promise.all(
            rooms.map(async room => {
                const members = await this.dh.getMembersByRoomName(room.name)
                return {
                roomName: room.name,
                members: members.length === 0 ? [] : members
                }
            })
        );
        return result;
    }

    notifyAll(event, data) {
        this.io.emit(event, data);
    }
}

module.exports = EventHandler;