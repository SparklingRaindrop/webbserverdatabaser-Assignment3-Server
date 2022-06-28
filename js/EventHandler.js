const md5 = require('md5');
const DataHandler = require('./DataHandler');
const {
    write,
} = require('./LogHandler');

class EventHandler {
    constructor(io) {
        this.io = io;
        this.userDict = {};
        this.dh = new DataHandler();
    }

    /// User ///
    async handleReady(socket, userName) {
        const lobbyId = await this.dh.getRoomBy({name: 'lobby'})
            .catch(reason => {
                write(reason.message, {error: true}, socket.id);
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });
        const allMembers = await this.dh.getAllUsers()
            .catch(reason => {
                write(reason.message, {error: true}, socket.id);
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });

        const userNameDuplicates = allMembers.filter(member => 
            member.name === userName
        ).length > 0;
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
            write(reason.message, {error: true}, socket.id);
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
        socket.emit('user:initialized', {
            user: newUser,
            roomList: roomList
        });

        // Share new data with the other users
        const userList = await this.dh.getAllUsers()
            .catch(reason => {
                write(reason.message, {error: true}, socket.id);
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });

        this.notifyAll('user:new_client', {
            users: userList,
            message: `${socket.id} has joined`,
        });
        return {
            status: 200
        }
    }

    /* 
        data = {
            name: string
            password: string / undefined
        }
    */
    async handleJoinRoom(socket, data) {
        const targetUser = await this.dh.getUserById(socket.id)
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });
        const origin = await this.dh.getRoomBy({id: targetUser.current_room_id})
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });
        const destination = await this.dh.getRoomBy({name: data.name})
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });

        if (!destination) {
            return {
                status: 404,
                message: `Room ${data.name} doesn't exist.`
            }
        }

        if (destination.password) {
            if (!data.password) {
                return {
                    status: 403,
                    message: `Please provide password to enter this room.`
                }
            }

            const hashedPassword = md5(data.password);
            if (destination.password !== hashedPassword) {
                return {
                    status: 403,
                    message: `Provided password was incorrect.`
                }
            }
        }

        await this.dh.moveRoom({
            id: socket.id,
            newRoomId: destination.id
        })
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });

        console.log('\x1b[34m%s\x1b[0m', `ID: ${socket.id} entered the room "${destination.name}"`);

        socket.leave(origin.name);
        socket.join(destination.name);

        const newTargetUser = await this.dh.getUserById(socket.id)
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });
        const newRoomList = await this.getRoomList()
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });
        this.notifyAll('room:new_list', newRoomList);
        socket.to(destination.name).emit('room:new_member', newTargetUser);

        return {
            status: 200,
        }
    }

    /* 
        data = {
            room_name: current_room or undefined,
            receiver: id or undefined,
        }
    */
    async handleTypingStart(socket, data) {
        const typingBy = await this.dh.getUserById(socket.id)
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });

        const notification = {
            typingBy,
            ...data,
        };

        if (data.hasOwnProperty('receiver')) {
            socket.to(data.receiver).emit('user:typing_started', notification);
        }
        socket.to(data.room_name).emit('user:typing_started', notification);

        return {
            status : 200
        }
    }
    
    async handleTypingStop(socket, data) {
        if (data.hasOwnProperty('receiver')) {
            socket.to(data.receiver).emit('user:typing_stopped');
        }
        socket.to(data.room_name).emit('user:typing_stopped');

        return {
            status : 200
        }
    }

    async handleTransportClose(id) {
        await this.dh.removeUserById(id)
            .catch(reason => {
                write(reason, {error: true}, id);
            });
    }

    async handleReconnect(socket, userName) {
        if (!userName) {
            return {
                status: 400,
                message: 'Expected user name.'
            }
        }

        await this.dh.updateUserId(socket.id, userName)
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });
        return {
            status: 200
        }
    }

    /// Message ///
    /* 
        data = {
            content: string,
            receiver: socket.id / string
        }
    */
    async handleSendMsg(socket, data) {
        if (!data || !data.content) {
            write('Message had no content.', {error: true}, socket.id);
            return {
                status: 400,
                message: 'Your message was rejected by server because it had no content.',
            };
        }
        if (!socket.id) {
            write('socket doesn\'t contain id.', {error: true}, socket.id);
            return {
                status: 400,
                message: 'Please refresh the page.',
            };
        }

        const { content, receiver } = data;
        const sender = await this.dh.getUserById(socket.id)
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });
        if (!sender) {
            write('socket doesn\'t contain id.', {error: true}, socket.id);
            return {
                status: 400,
                message: 'Please refresh the page.',
            };
        }
        const receiverData = await this.dh.getUserById(receiver)
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });
        const newMessage = {
            sender: socket.id,
            sender_name: sender.name,
            content: content,
            timestamp: new Date().toString(),
        };

        // When receiver is not provided, it's sent to the room
        if (!receiver) {
            newMessage.room_id = sender.current_room_id;
        } else {
            newMessage.receiver= receiverData.id;
        }
        await this.dh.addMessage(newMessage)
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });

        console.log(
            '\x1b[35m%s\x1b[0m',
            `ID: ${sender.id} has sent "${content}" ` +
            `to ${receiver ? receiver : `the room ID:[${sender.current_room_id}]` }`
        );

        // Group message
        if (!receiver) {
            const room = await this.dh.getRoomBy({
                id: sender.current_room_id
            })
                .catch(reason => {
                    write(reason, socket.id, {error: true});
                    return {
                        status: 500,
                        message: 'Something happened on the server.',
                    };
                });
            socket.to(room.name).emit('msg:new', newMessage);
        } else {
            this.io.to(receiver).emit('msg:new', newMessage);
        }

        return {status: 200};
    }

    /// Room ///
    /*
        newRoom = {
            name: string
            password: string / undefined
        }
    */
    async handleCreateRoom(socket, newRoom) {
        const roomName = newRoom.name;
        const password = newRoom.password;

        if (roomName.length > 15) {
            return {
                status: 400,
                message: 'Room name must be shorter than 15 characters.',
            };
        }

        if (!roomName.replace(/\s/g, '').length) {
            return {
                status: 400,
                message: 'Room name must contain at least one character or symbol.',
            };
        }

        const roomList = await this.dh.getAllRoom()
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });
        if (roomList.filter(room => room.name === roomName).length === 0) {
            if(password !== '') {
                newRoom.password = md5(newRoom.password);
            }
            await this.dh.createNewRoom(newRoom)
                .catch(reason => {
                    write(reason, socket.id, {error: true});
                    return {
                        status: 500,
                        message: 'Something happened on the server.',
                    };
                });

            console.log('\x1b[34m%s\x1b[0m', `ID: ${socket.id} created a new room "${roomName}"`);

            const roomList = await this.getRoomList()
                .catch(reason => {
                    write(reason, socket.id, {error: true});
                    return {
                        status: 500,
                        message: 'Something happened on the server.',
                    };
                });
            this.notifyAll('room:created', roomName);
            this.notifyAll('room:new_list', roomList);

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
        data = {
            name: string
            password: string / undefined
        }
    */
    async handleDeleteRoom(socket, data) {
        if (data.name === 'lobby') {
            return  {
                status: 400,
                message: `Lobby can not be deleted.`
            }
        }
        if (data.name === '') {
            return  {
                status: 400,
                message: `Please provide a room name.`
            }
        }

        const targetRoom = await this.dh.getRoomBy({
            name: data.name
        })
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });
        if (!targetRoom) {
            return {
                status: 400,
                message: `Cannot find room with the name, ${data.name}`
            }
        }

        const members = await this.dh.getMembersByRoomID(targetRoom.id)
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });
        const isEmpty = members.length === 0;
        if (!isEmpty) {
            return {
                status: 400,
                message: `Cannot delete room when the room isn't empty.`
            }
        }

        if (targetRoom.password !== null && data.password === '') {
            return {
                status: 403,
                message: `Password is missing.`
            }
        }

        if (targetRoom.password !== null) {
            const hashedPassword = md5(data.password);
            if (targetRoom.password !== hashedPassword) {
                return {
                    status: 403,
                    message: `Incorrect password.`
                }
            }
        }

        await this.dh.removeRoomById(targetRoom.id)
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });

        console.log('\x1b[34m%s\x1b[0m', `ID: ${socket.id} deleted a room "${data.name}"`);

        const newRoomList = await this.getRoomList()
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });
        this.notifyAll('room:deleted', data.name);
        this.notifyAll('room:new_list', newRoomList);
        return {
            status: 200,
            message: `${data.name} is removed.`
        }
    }

    async getRoomList() {
        const rooms = await this.dh.getAllRoom()
            .catch(reason => {
                write(reason, socket.id, {error: true});
                return {
                    status: 500,
                    message: 'Something happened on the server.',
                };
            });
        const result = await Promise.all(
            rooms.map(async room => {
                const members = await this.dh.getMembersByRoomID(room.id)
                    .catch(reason => {
                        write(reason, socket.id, {error: true});
                        return {
                            status: 500,
                            message: 'Something happened on the server.',
                        };
                    });
                return {
                roomName: room.name,
                password: room.password === 1 ? true : false,
                members: members.length === 0 ? [] : members
                }
            })
        );
        return result;
    }

    /// Functions ///
    notifyAll(event, data) {
        this.io.emit(event, data);
    }
}

module.exports = EventHandler;