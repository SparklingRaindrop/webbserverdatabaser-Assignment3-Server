class Message {
    constructor({content, senderSocketId, room, receiverSocketId}) {
        this.content = content;
        this.senderSocketId = senderSocketId;
        this.room = room;
        this.receiverSocketId = receiverSocketId;
        this.timestamp = new Date();
    }

    
}

module.exports = Message;