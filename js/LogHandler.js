const fs = require('fs/promises');

function logHandler(socket, next) {
    const timeStamp = new Date().toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: 'CET',
    });

    socket.onAny((event, data) => {
        console.log('logwriter', event, data);
        let content;
        switch(event) {
            case 'send_msg':
                const { message, receiver } = data;
                content = `"${message}" to ${receiver ?
                    `ID: ${receiver}` :
                    socket.rooms[1]
                }`;
                break;
            case 'join_room':
                content = `join to ${data}`;
                break;
            case 'ready':
                content = `set username as ${data.userName}`;
        }
        log = `[${timeStamp}] "${event}" ${content ? `| ${content}` : ''} | by ${socket.id}\n`;
        write(log);
    });
    next();
}

function write(data) {
    try {
        fs.writeFile('system.log', data, {flag: 'a'});
    } catch (err) {
        console.error('\x1b[43m%s\x1b[0m', err);
    }
}


module.exports = logHandler;