import dotevn from 'dotenv';
import express from 'express'
import http from 'http';
import socketIO, { Socket } from 'socket.io'
import cors from 'cors';
import db from './db';
import { Room, User } from '../g';
dotevn.config();
const app = express()

const server = http.createServer(app)
const io = new socketIO.Server(server, {
    cors: {
        origin: '*'
    }
});
app.use(cors());
app.get('/', (req, res) => {
    res.send(`<h1>Node server awake port ${process.env.SERVER_PORT}</h1>`)
});

let rooms: Room[] = [];

io.on('connect', (socket: Socket) => {
    //join
    socket.on('user-join-session', async ({ user, sId }: { user: User, sId: string }, cb) => {
        let cRoom = rooms.find(room => room.id === sId);
        if (!cRoom) {
            const _room: Room = {
                id: sId,
                users: [user],
                votes: []
            }
            let second = 100;
            let intarvalId = setInterval(() => {
                second--;
                socket.to(sId).emit('count', second);
                if (second === 0) {
                    clearInterval(intarvalId);
                }
            }, 1000);
            cRoom = _room as Room;
            rooms.push(_room);

        } else {
            const isUserExist = cRoom.users!.some((u: any) => u.id === user.id);
            if (!isUserExist) cRoom.users!.push(user);
        }
        cb({ user, room: cRoom });
        socket.join(sId);
        
        socket.broadcast.to(sId).emit('user-joined-session', { joinedUser: user, room: cRoom });

    })

    //leave

    socket.on('user-leave-room', ({ user, sId }: { user: User, sId: string }, cb) => {
        console.log(user, 'user was left');
        let cRoom = rooms.find(room => room.id === sId);
        if (!cRoom) return;
        cRoom.users = cRoom.users!.filter(u => u.id !== user.id);
        socket.broadcast.to(sId).emit('user-left-room', { user, room: cRoom });
    });


    //vote

    socket.on('user-vote', () => {
        console.log('user vote');
    })

    socket.emit('user-voted');

    // disconnect

    socket.on('out-session', () => {
        console.log('user out');
    })
});


server.listen(5000)