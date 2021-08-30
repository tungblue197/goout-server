"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class VoteSocket {
    constructor(socket, io) {
        this.socket = socket;
        this.io = io;
        this.onJoin();
    }
    onJoin() {
        this.socket.on('join', (uId, gId) => {
            console.log('user was join : ', uId);
        });
    }
}
exports.default = VoteSocket;
