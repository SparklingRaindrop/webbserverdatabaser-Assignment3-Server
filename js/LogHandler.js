const fs = require('fs/promises');

function logHandler(socket, next) {
    const timeStamp = generateTimestamp();

    socket.onAny((event, data) => {
        console.log('logwriter', event, data, Array.from(socket.rooms));
        let content;
        switch(event) {
            case 'send_msg':
                const { message, receiver } = data;
                content = `"${message}" to ${receiver ?
                    `ID: ${receiver}` :
                    Array.from(socket.rooms)[1]
                }`;
                break;
            case 'join_room':
                content = `joined to "${data}"`;
                break;
            case 'create_room':
                content = `created a room "${data}"`;
                break;
            case 'remove_room':
                content = `removed a room "${data}"`;
                break;
            case 'ready':
                content = `set username as "${data.userName}"`;
        }
        log = `[${timeStamp}] "${event}" ${content ? `| ${content}` : ''} | by "${socket.id}"\n`;
        write(log);
    });
    next();
}

function generateTimestamp() {
    return new Date().toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: 'CET',
    });
}

function write(data) {
    try {
        fs.writeFile('system.log', data, {flag: 'a'});
    } catch (err) {
        console.error('\x1b[43m%s\x1b[0m', err);
    }
}


module.exports = {
    logHandler,
    write,
    generateTimestamp,
}