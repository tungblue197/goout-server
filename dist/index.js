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
const db_1 = __importDefault(require("./db"));
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
io.on('connection', (socket) => {
    //join
    socket.on('user-join-session', ({ user, sId }, cb) => __awaiter(void 0, void 0, void 0, function* () {
        let cRoom = rooms.find(room => room.id === sId);
        if (!cRoom) {
            const _room = {
                id: sId,
                users: [user],
                votes: []
            };
            const queryStr = `select timeout, done from sessions where id = $1 limit 1`;
            cRoom = _room;
            rooms.push(_room);
            socket.join(sId);
            db_1.default.query(queryStr, [sId])
                .then(res => {
                if (res.rowCount) {
                    const _session = res.rows[0];
                    if (_session.done) {
                        return io.sockets.to(sId).emit('vote-done', sId);
                    }
                    let second = _session.timeout * 60;
                    let intarvalId = setInterval(() => {
                        io.sockets.to(sId).emit('countdown', second);
                        second--;
                        if (second === 0) {
                            clearInterval(intarvalId);
                            const winner = getLocationWinner(cRoom === null || cRoom === void 0 ? void 0 : cRoom.votes);
                            console.log('winner : ', winner);
                            if (!winner) {
                                return io.sockets.to(sId).emit('vote-error');
                            }
                            const sessionQueryStr = `update sessions set done = $1, winner = $2 where id = $3`;
                            db_1.default.query(sessionQueryStr, [true, winner.lId, sId])
                                .then(res => {
                                io.sockets.to(sId).emit('vote-done', sId);
                            })
                                .catch(err => {
                                return io.sockets.to(sId).emit('vote-error');
                            });
                        }
                    }, 1000);
                    // vẫn còn thời gian
                }
            });
        }
        else {
            const isUserExist = cRoom.users.some((u) => u.id === user.id);
            if (!isUserExist) {
                socket.join(sId);
                cRoom.users.push(user);
            }
        }
        rooms = rooms.map(i => {
            if (cRoom && i.id === cRoom.id)
                return cRoom;
            return i;
        });
        cb({ user, room: cRoom });
        socket.broadcast.to(sId).emit('user-joined-session', { joinedUser: user, room: cRoom });
    }));
    //leave
    socket.on('user-leave-room', ({ user, sId }, cb) => {
        let cRoom = rooms.find(room => room.id === sId);
        if (!cRoom)
            return;
        cRoom.users = cRoom.users.filter(u => u.id !== user.id);
        socket.broadcast.to(sId).emit('user-left-room', { user, room: cRoom });
    });
    //vote
    socket.on('user-vote', ({ user, sId, location }) => {
        var _a, _b;
        const cRoom = rooms.find(room => room.id === sId);
        if (cRoom) {
            const uId = user.id;
            const lId = location.id;
            const vote = { uId, lId };
            if (!((_a = cRoom.votes) === null || _a === void 0 ? void 0 : _a.length)) {
                cRoom.votes = [vote];
            }
            else {
                cRoom.votes = (_b = cRoom.votes) === null || _b === void 0 ? void 0 : _b.map(v => {
                    if (v.uId === uId)
                        return vote;
                    return v;
                });
            }
            io.sockets.to(sId).emit('user-voted', cRoom.votes);
        }
    });
    // disconnect
    socket.on('out-session', () => {
        console.log('user out');
    });
});
function getLocationWinner(arr) {
    let c = null;
    let max = 0;
    if (!arr)
        return c;
    arr.forEach(i => {
        const l = arr.filter(item => item.lId === i.lId).length;
        if (l > max) {
            max = l;
            c = i;
        }
    });
    return c;
}
server.listen(process.env.PORT || 5000);
