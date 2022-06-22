class Message {
    constructor({content, sender, receiver}) {
        this.content = content;
        this.sender = sender; // User
        this.receiver = receiver; // User
        this.timestamp = new Date();
    }
    toObj() {
        return {
            content: this.content,
            sender: this.sender.getState(),
            receiver: this.receiver ? this.receiver.getState() : null,
            timestamp: this.timestamp,
        }
    }
}

module.exports = Message;