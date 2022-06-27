const md5 = require('md5');
const DataHandler = require('./DataHandler');
const {
    write,
    generateTimestamp
} = require('./LogHandler');

class EventHandler {
    constructor(io) {
        this.io = io;
        this.userDict = {};
        this.dh = new DataHandler();
    }

    async handleReady(socket, userName) {
        const lobbyId = await this.dh.getRoomIdByRoomName('lobby');
        const allMembers = await this.dh.getAllUsers();
        const userNameDuplicates = allMembers.filter(member => member.name === userName).length > 0;
        if (userNameDuplicates) {
            return {
                status: 500,
                message: `"${userName}" already exists on the database. Choose another name.`,
            };
        }

        const newUser = await this.dh.addNewUser({
            id: socket.id,
            name: userName,
            current_room_id: lobbyId.id
        }).catch(reason => {
            write(`${generateTimestamp()}] "ready" ERROR OCCURRED to ${socket.id} ${reason}`);
            return {
                status: 500,
                message: 'Something happened on the server.',
            };
        });

        await this.handleJoinRoom(socket, {
            name: 'lobby'
        });
        const roomList = await this.getRoomList();

        // Sending initial value to the user
        socket.emit('user_initialized', {
            user: newUser,
            roomList: roomList
        });

        // Share new data with the other users
        const userList = await this.dh.getAllUsers();
        this.notifyAll('new_client', {
            users: userList,
            message: `${socket.id} has joined`,
        });
        return {
            status: 200
        }
    }

    /* 
        data = {
            content: string,
            receiver: socket.id / string
        }
    */
    async handleSendMsg(socket, data) {
        if (!data || !data.content) {
            write(`${generateTimestamp()}] "sendMsg" ERROR OCCURRED to ${socket.id} 'no content'`);
            return {
                status: 400,
                message: 'Your message was rejected by server because it had no content.',
            };
        }

        const { content, receiver } = data;
        const sender = await this.dh.getUserById(socket.id);
        const receiverData = await this.dh.getUserById(receiver);
        const newMessage = {
            sender: socket.id,
            sender_name: sender.name,
            receiver: receiverData,
            content: content,
            timestamp: new Date().toString(),
        };

        // When receiver is not provided, it's sent to the room
        if (!receiver) {
            newMessage.room_id = sender.current_room_id;
        }
        await this.dh.addMessage(newMessage)
            .catch(() => ({
                    status: 500,
                    message: 'Something went wrong on the server.',
            }));

        console.log(
            '\x1b[35m%s\x1b[0m',
            `ID: ${sender.id} has sent "${content}" ` +
            `to ${receiver ? receiver : `the room ID:[${sender.current_room_id}]` }`
        );

        // Group message
        if (!receiver) {
            const room = await this.dh.getRoomBy({
                id: sender.current_room_id
            });
            socket.to(room.name).emit('new_msg', newMessage);
        } else {
            this.io.to(receiver).emit('new_msg', newMessage);
        }
        
        return {status: 200};
    }

    /* 
        newRoom = {
            name: string
            password: string / undefined
        }
    */
    async handleCreateRoom(socket, newRoom) {
        const roomName = newRoom.name;
        const password = newRoom.password;

        const roomList = await this.dh.getAllRoom();
        if (roomList.filter(room => room.name === roomName).length === 0) {
            if(password !== '') {
                newRoom.password = md5(newRoom.password); // CHECK VALID PASSWORD
            }
            await this.dh.createNewRoom(newRoom);
            console.log('\x1b[34m%s\x1b[0m', `ID: ${socket.id} created a new room "${roomName}"`);
            const roomList = await this.getRoomList();
            this.notifyAll('room_created', roomName);
            this.notifyAll('update_room_list', roomList);
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

    /* 
        newRoomObj = {
            name: string
            password: string / undefined
        }
    */
    async handleJoinRoom(socket, newRoomObj) {
        const targetUser = await this.dh.getUserById(socket.id);
        const oldRoom = await this.dh.getRoomBy({id: targetUser.current_room_id});
        const newRoom = await this.dh.getRoomBy({name: newRoomObj.name});

        if (!newRoom) {
            return {
                status: 404,
                message: `Room ${newRoomObj.name} doesn't exist.`
            }
        }
        
        if (newRoom.password) {
            if (!newRoomObj.password) {
                return {
                    status: 403,
                    message: `Please provide password to enter this room.`
                }
            }

            const hashedPassword = md5(newRoomObj.password);
            if (newRoom.password !== hashedPassword) {
                return {
                    status: 403,
                    message: `Incorrect password.`
                }
            }
        }
        
        await this.dh.moveRoom({
            id: socket.id,
            newRoomId: newRoom.id
        });
        console.log('\x1b[34m%s\x1b[0m', `ID: ${socket.id} entered the room "${newRoom.name}"`);

        socket.leave(oldRoom.name);
        socket.join(newRoom.name);

        const newTargetUser = await this.dh.getUserById(socket.id);
        const newRoomList = await this.getRoomList();
        this.notifyAll('update_room_list', newRoomList);
        socket.to(newRoom.name).emit('room_new_member', newTargetUser);
        return {
            status: 200,
        }
    }

    async handleTransportClose(id) {
        await this.dh.removeUser(id);
    }

    /* 
        target = {
            name: string
            password: string / undefined
        }
    */
    async handleRemoveRoom(socket, target) {
        if (target.name === 'lobby') {
            return  {
                status: 400,
                message: `Lobby can not be deleted.`
            }
        }
        if (target.name === '') {
            return  {
                status: 400,
                message: `Please provide a room name.`
            }
        }

        const targetRoom = await this.dh.getRoomBy({
            name: target.name
        });
        if (!targetRoom) {
            return {
                status: 400,
                message: `Cannot find room with the name, ${target.name}`
            }
        }

        const members = await this.dh.getMembersByRoomName(target.name)
        const isEmpty = members.length === 0;
        if (!isEmpty) {
            return {
                status: 400,
                message: `Cannot delete room when the room isn't empty.`
            }
        }

        if (targetRoom.password !== null && target.password === '') {
            return {
                status: 403,
                message: `Password is missing.`
            }
        }

        if (targetRoom.password !== null) {
            const hashedPassword = md5(target.password);
            if (targetRoom.password !== hashedPassword) {
                return {
                    status: 403,
                    message: `Incorrect password.`
                }
            }
        }

        this.dh.removeRoom(target.name);
        console.log('\x1b[34m%s\x1b[0m', `ID: ${socket.id} deleted a room "${target.name}"`);

        const newRoomList = await this.getRoomList()
        this.notifyAll('room_deleted', target.name);
        this.notifyAll('update_room_list', newRoomList);
        return {
            status: 200,
            message: `${target.name} has removed.`
        }
    }

    /* 
        data = {
            room_name: current_room or undefined,
            receiver: id or undefined,
        }
    */
    async handleTypingStart(socket, data) {
        const typingBy = await this.dh.getUserById(socket.id);

        const notification = {
            typingBy,
            ...data,
        };

        if (data.hasOwnProperty('receiver')) {
            socket.to(data.receiver).emit('user_typing_start', notification);
            return {
                status : 200
            }
        }
        socket.to(data.room_name).emit('user_typing_start', notification);
    }

    async handleTypingStop(socket, data) {
        if (data.receiver) {
            socket.to(data.receiver).emit('user_typing_stop');
            return {
                status : 200
            }
        }
        socket.to(data.room_name).emit('user_typing_stop');
    }

    async getRoomList() {
        const rooms = await this.dh.getAllRoom();
        const result = await Promise.all(
            rooms.map(async room => {
                const members = await this.dh.getMembersByRoomID(room.id)
                return {
                roomName: room.name,
                password: room.password === 1 ? true : false,
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