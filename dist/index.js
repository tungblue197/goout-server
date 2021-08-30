"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.default.Server(server, {
    cors: {
        origin: '*'
    }
});
app.use((0, cors_1.default)());
app.get('/', (req, res) => {
    res.send(`<h1>Node server awake port ${process.env.SERVER_PORT}</h1>`);
});
let rooms = [];
io.on('connect', (socket) => {
    //join
    socket.on('user-join-session', ({ user, sId }, cb) => __awaiter(void 0, void 0, void 0, function* () {
        let cRoom = rooms.find(room => room.id === sId);
        if (!cRoom) {
            const _room = {
                id: sId,
                users: [user],
                votes: []
            };
            let second = 100;
            let intarvalId = setInterval(() => {
                second--;
                socket.to(sId).emit('count', second);
                if (second === 0) {
                    clearInterval(intarvalId);
                }
            }, 1000);
            cRoom = _room;
            rooms.push(_room);
        }
        else {
            const isUserExist = cRoom.users.some((u) => u.id === user.id);
            if (!isUserExist)
                cRoom.users.push(user);
        }
        cb({ user, room: cRoom });
        socket.join(sId);
        socket.broadcast.to(sId).emit('user-joined-session', { joinedUser: user, room: cRoom });
    }));
    //leave
    socket.on('user-leave-room', ({ user, sId }, cb) => {
        console.log(user, 'user was left');
        let cRoom = rooms.find(room => room.id === sId);
        if (!cRoom)
            return;
        cRoom.users = cRoom.users.filter(u => u.id !== user.id);
        socket.broadcast.to(sId).emit('user-left-room', { user, room: cRoom });
    });
    //vote
    socket.on('user-vote', () => {
        console.log('user vote');
    });
    socket.emit('user-voted');
    // disconnect
    socket.on('out-session', () => {
        console.log('user out');
    });
});
server.listen(process.env.SERVER_PORT || 5000);
