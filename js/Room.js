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
        console.log(this);
        return {
            name: this.name,
            members: this.getMembers(),
            createdBy: this.createdBy ? this.createdBy.getState() : { name: 'server' },
        }
    }
}

module.exports = Room;