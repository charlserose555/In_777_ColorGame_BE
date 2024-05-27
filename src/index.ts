import * as express from 'express';
// import * as http from 'http';
// const socketIo = require('socket.io');
import * as mongoose from 'mongoose';
import { Server, Socket } from 'socket.io';
const app = express();
import socket from './socket';

const listen = (io: Server): void => {
}

const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: '*' } });
socket(io);
app.set('io', io);
listen(io);
http.listen(4000);
console.log('server listening on:', 4000);

// mongoose
//     .connect(process.env.DATABASE as string)
//     .then(async () => {
//         const db = mongoose.connection.db;

//         // initRedis();
//         // GetGameListJob();
//     //    fetchBOGames()

//         const port = process.env.SOCKETPORT || 5000;
//         if (process.env.TYPE === 'https') {
//             // const options = {
//             //     key: fs.readFileSync('/etc/ssl/priv_bcb_io.key'),
//             //     cert: fs.readFileSync('/etc/ssl/bcb_io.pem')
//             // };
//             // const https = require('https').createServer(options, app);
//             // const io = require('socket.io')(https, { cors: { origin: '*' } });
//             // socket(io);
//             // app.set('io', io);
//             // listen(io);
//             // https.listen(port);
//             // console.log('server listening on - https:', port);
//         } else {
//             const http = require('http').createServer(app);
//             const io = require('socket.io')(http, { cors: { origin: '*' } });
//             socket(io);
//             app.set('io', io);
//             listen(io);
//             http.listen(port);
//             console.log('server listening on:', port);
//         }
//     })
//     .catch((error: any) => {
//         console.log('database connection error => ', error);
//     });
