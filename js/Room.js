class Room {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        this.members = [];
    }
    getName() {
        return this.name;
    }
    updateMessage(msg) {
        this.messages.push(msg);
    }
    getMembers() {
        return this.members.map(member => member.name);
    }
    addMember(user) {
        this.members.push(user);
    }
}

module.exports = Room;