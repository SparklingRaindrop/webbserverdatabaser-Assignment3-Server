class Message {
    constructor({content, sender, receiver}) {
        this.content = content;
        this.sender = sender; // User
        this.receiver = receiver; // User
        this.timestamp = new Date();
    }
    toObj() {
        return {...this}
    }
}

module.exports = Message;