const fs = require('fs/promises');

function logHandler(socket, next) {
    const timeStamp = generateTimestamp();

    socket.onAny((event, data) => {
        let body;
        
        switch(event) {
            case 'send_msg':
                const { content, receiver } = data;
                body = `"${content}" to ${receiver ?
                    `ID: ${receiver}` :
                    Array.from(socket.rooms)[1]
                }`;
                break;
            case 'join_room':
                body = `joined to "${data}"`;
                break;
            case 'create_room':
                body = `created a room "${data}"`;
                break;
            case 'remove_room':
                body = `removed a room "${data}"`;
                break;
            case 'ready':
                body = `set username as "${data.userName}"`;
                
        }
        const log = `[${timeStamp}] "${event}" ${body ? `| ${body}` : ''} | by "${socket.id}"\n`;
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

function write(data, id, type) {
    let isError;
    if (type) {
        isError = type.error;
    }

    try {
        if (isError) {
            const log = `[${generateTimestamp()}] | ${data} | ${id}\n`;
            fs.writeFile('error.log', log, {flag: 'a'});
        } else {
            fs.writeFile('system.log', data, {flag: 'a'});
        }
    } catch (err) {
        console.error('\x1b[43m%s\x1b[0m', err);
    }
}

module.exports = {
    logHandler,
    write,
}