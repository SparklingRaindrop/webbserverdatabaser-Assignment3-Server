class Room {
    constructor(name) {
        this.name = name;
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
    toObj() {
        return {...this}
    }
}

module.exports = Room;