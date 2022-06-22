require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const User = require('./js/User');
const Room = require('./js/Room');
const Message = require('./js/Message');
const logHandler = require('./js/LogHandler');
const SystemHandler = require('./js/SystemHandler');

const USERNAME = 'admin';
const PASSWORD = 'aaaa';

const app = express();
const httpServer = createServer(app);
/* const sessionMiddleware = session({
    secret: process.env.SECRET_KEY,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    },
    resave: false
});
app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000',
}));
app.use(sessionMiddleware); */


/* app.post('/login', (req, res) => {
    if (!req.body.username || !req.body.password) {
        res.status(400).send({
            error: 'username or password is missing'
        });
    }
    const {username, password} = req.body;
    const session = req.session;
    if (username === USERNAME && password === PASSWORD) {
        session.authenticated = true;
        session.save();
        res.send({
            message: 'Successfully logged in.'
        })
    } else {
        res.send({
            message: 'Username or password is wrong.'
        })
    }
}); */

const options = {
    cors: {
        origin: 'http://localhost:3000',
        method: ['GET', 'POST']
    }
};

const io = new Server(httpServer, options);
const systemHandler = new SystemHandler(io);

/* 
function wrap(middleware) {
    return function (socket, next) {
        return middleware(socket.request, {}, next);
    };
}
io.use(wrap(sessionMiddleware));
io.use((socket, next) => {
    const session = socket.request.session;
    if (session && session.authenticated) {
        next();
    } else {
        next(new Error("unauthorized"));
    }
});
*/
io.use((socket, next) => {
    console.log("\x1b[34m%s\x1b[0m", `ID: ${socket.id} is connected.`);
    next();
});

io.use((socket, next) => {
    if (socket.user) {
        socket.emit('error', {
            status: 400,
            message: 'Update Browser'
        });
        socket.disconnect();
    } else {
        next();
    }
    
});

io.use(logHandler);

io.on('connection', (socket) => {
    socket.on('ready', async ({userName}) => {
        // Check if userName is not empty
        console.log('\x1b[34m%s\x1b[0m', `ID: ${socket.id} set username as ${userName}.`);
        systemHandler.addNewUser(socket, userName);
        systemHandler.notifyAll('new_client', `${userName} has joined`);
    });

    // Receiver for direct message 
    socket.on('send_msg', (data, callback) => {
        const response = systemHandler.handleIncomingMsg(socket, data);
        // response ===> status: 400 || status: 200
        callback(response);
    });

    socket.on('join_room', (roomName, callback) => {
        socket.leave(socket.user.currentRoom.name)
        //socket.emit('status_update', status);
        // Check if it exists
        socket.join(roomName);

        const index = roomList.findIndex(item => item.name === roomName);
        if (index > -1) {
            socket.user.currentRoom = roomList[index];
        } else {
            const newRoom = createNewRoom();
            io.emit('notify_new_room', roomList.toObj());
            console.log('\x1b[34m%s\x1b[0m', `ID: ${socket.id} created a new room "${roomName}"`);
            socket.user.currentRoom = newRoom;
        } 
        callback(`Joined to ${roomName}`);
    });
});

httpServer.listen(process.env.PORT);
console.log('\x1b[42m%s\x1b[0m', `Server is running on ${process.env.PORT}`);
