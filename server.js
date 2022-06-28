require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const {logHandler} = require('./js/LogHandler');
const EventHandler = require('./js/EventHandler');

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
        origin: ['http://localhost:3000/chat', 'http://localhost:3000'],
        method: ['GET', 'POST']
    }
};

const io = new Server(httpServer, options);
const eventHandler = new EventHandler(io);

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
    
    socket.on('disconnect', (reason) => {
        if (reason === 'transport close') {
            eventHandler.handleTransportClose(socket.id);
        }
    });

    socket.on('user:reconnect', async (userName, callback) => {
        const response = await eventHandler.handleReconnect(socket, userName);
        callback(response);
    });

    // list of all the sockets Array.from(io.sockets.sockets).map(socket => socket[0])
    socket.on('user:ready', async ({userName}, callback) => {
        // Check if userName is not empty
        console.log('\x1b[34m%s\x1b[0m', `ID: ${socket.id} set username as ${userName}.`);
        const response = await eventHandler.handleReady(socket, userName);
        // response ===> status: 400 || status: 200
        callback(response);
    });

    // Optional property: Receiver for direct message 
    socket.on('msg:send', async (data, callback) => {
        const response = await eventHandler.handleSendMsg(socket, data);
        callback(response);
    });

    socket.on('user:join_room', async (roomName, callback) => {
        const response = await eventHandler.handleJoinRoom(socket, roomName);
        callback(response);
    });

    socket.on('room:create', async (newRoom, callback) => {
        const response = await eventHandler.handleCreateRoom(socket, newRoom);
        callback(response);
    });

    socket.on('room:delete', async (roomName, callback) => {
        const response = await eventHandler.handleDeleteRoom(socket, roomName);
        callback(response);
    });

    socket.on('user:typing_start', async (data, callback) => {
        const response = await eventHandler.handleTypingStart(socket, data);
        callback(response);
    });

    socket.on('user:typing_stop', async (data, callback) => {
        const response = await eventHandler.handleTypingStop(socket, data);
        callback(response);
    });
});

httpServer.listen(process.env.PORT);
console.log('\x1b[42m%s\x1b[0m', `Server is running on ${process.env.PORT}`);
