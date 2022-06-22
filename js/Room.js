class Room {
    constructor({name, createdBy}) {
        this.name = name;
        this.members = [];
        this.createdBy = createdBy;
    }
    getName() {
        return this.name;
    }
    updateMessage(msg) {
        this.messages.push(msg);
    }
    getMembers() {
        return this.members.map(member => member. getState());
    }
    addMember(user) {
        this.members.push(user);
    }
    removeMember(user) {
        this.members = this.members.filter(member => member.getSocketId() !== user.getSocketId());
    }
    toObj() {
        return {
            name: this.name,
            members: this.getMembers(),
            createdBy: this.createdBy,
        }
    }
}

module.exports = Room;