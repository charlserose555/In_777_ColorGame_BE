import { Socket } from 'socket.io';
import { Sessions, Users } from '../models';
import { globalTime, ObjectId } from '../controllers/base';
import { getSecondsElapsedToday } from '../util/util';
let countdown = 175; // Initial countdown value
let interval : any;

export default (io: any) => {
    io.on('connection', async (socket: any) => {
        console.log('New client connected');
    
        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });

        const query = socket.handshake.query;
        if (query.auth) {
            try {
                const decoded = await Sessions.findOneAndUpdate({ accessToken: query.auth }, { socketId: socket.id });
                if (decoded) {
                    const user = await Users.findById(ObjectId(decoded.userId));
                    if (!user) {
                        io.to(socket.id).emit('logout');
                        await Sessions.deleteOne({ userId: decoded.userId });
                    }
                } else {
                    io.to(socket.id).emit('logout');
                }
            } catch (err) {
                io.to(socket.id).emit('logout');
            }
        }
        socket.on('disconnect', async () => {
            await Sessions.updateOne({ socketId: socket.id }, { socketId: '' });
        });

        // socket.on('msg send', (data: any) => {
        //     socket.broadcast.emit('msg', { data: data });
        //     sendMsg(data)
        // })

        socket.on("getchartdata", async () => {
        })
    });
};
