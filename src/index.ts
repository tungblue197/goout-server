import dotevn from 'dotenv';
import express from 'express'
import http from 'http';
import socketIO, { Socket } from 'socket.io'
import cors from 'cors';
import db from './db';
import { Room, User, Vote } from '../g';
import e from 'express';
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

io.on('connection', (socket: Socket) => {
    //join
    socket.on('user-join-session', async ({ user, sId }: { user: User, sId: string }, cb) => {
        let cRoom = rooms.find(room => room.id === sId);

        if (!cRoom) {
            const _room: Room = {
                id: sId,
                users: [user],
                votes: []
            }
            const queryStr = `select timeout, done from sessions where id = $1 limit 1`;
            cRoom = _room as Room;
            rooms.push(_room);
            socket.join(sId);
            db.query(queryStr, [sId])
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
                                const winner: any = getLocationWinner(cRoom?.votes);
                                console.log('winner : ', winner);
                                if(!winner){
                                    return io.sockets.to(sId).emit('vote-error');
                                }
                                const sessionQueryStr = `update sessions set done = $1, winner = $2 where id = $3`;
                                
                                db.query(sessionQueryStr, [true, winner.lId, sId])
                                    .then(res => {
                                        io.sockets.to(sId).emit('vote-done', sId);
                                    })
                                    .catch(err => {
                                        return io.sockets.to(sId).emit('vote-error');
                                    })
                            }
                        }, 1000);
                        // vẫn còn thời gian
                    }
                });
        } else {
            const isUserExist = cRoom.users!.some((u: any) => u.id === user.id);
            if (!isUserExist) {
                socket.join(sId);
                cRoom.users!.push(user);
            }
        }
        rooms = rooms.map(i => {
            if (cRoom && i.id === cRoom.id) return cRoom;
            return i;
        })
        cb({ user, room: cRoom });

        socket.broadcast.to(sId).emit('user-joined-session', { joinedUser: user, room: cRoom });

    })

    //leave

    socket.on('user-leave-room', ({ user, sId }: { user: User, sId: string }, cb) => {
        let cRoom = rooms.find(room => room.id === sId);
        if (!cRoom) return;
        cRoom.users = cRoom.users!.filter(u => u.id !== user.id);
        socket.broadcast.to(sId).emit('user-left-room', { user, room: cRoom });
    });


    //vote

    socket.on('user-vote', ({ user, sId, location }) => {
        const cRoom = rooms.find(room => room.id === sId);
        if (cRoom) {
            const uId = user.id;
            const lId = location.id;
            const vote: Vote = { uId, lId };
            if (!cRoom.votes?.length) {
                cRoom.votes = [vote];
            } else {
                cRoom.votes = cRoom.votes?.map(v => {
                    if (v.uId === uId) return vote;
                    return v;
                });
            }
            io.sockets.to(sId).emit('user-voted', cRoom.votes);
        }

    })


    // disconnect

    socket.on('out-session', () => {
        console.log('user out');
    })
});


function getLocationWinner(arr?: Vote[]){
    let c = null;
    let max = 0;
    if(!arr) return c;
    arr.forEach(i => {
      const l = arr.filter(item => item.lId === i.lId).length;
      if(l > max) {
        max = l;
        c = i
      }
      
    })
    return c
}


server.listen(process.env.PORT || 5000)