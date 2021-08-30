"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const vote_1 = __importDefault(require("./sockets/vote"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.default.Server(server, {
    cors: {
        origin: '*'
    }
});
app.get('/', (req, res) => {
    res.send(`<h1>Node server awake port ${process.env.SERVER_PORT}</h1>`);
});
io.on('connect', (socket) => {
    new vote_1.default(socket, io);
});
app.listen(process.env.SERVER_PORT || 5000);
