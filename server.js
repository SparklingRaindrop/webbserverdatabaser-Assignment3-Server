require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const USERNAME = 'admin';
const PASSWORD = 'aaaa';

//const app = express();
//const httpServer = createServer(app);

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

//const io = new Server(httpServer, options);
const io = new Server(options);
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


io.on('connection', (socket) => {
    socket.on('ready', (data) => {
        console.log(`${socket.id} is connected.`, data);
    });
});

io.listen(process.env.PORT);
