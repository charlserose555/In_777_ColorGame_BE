import { Socket } from 'socket.io';
import { Sessions, Users } from '../models';
import { globalTime, ObjectId } from '../controllers/base';
let countdown = 175; // Initial countdown value
let interval : any;

export default (io: any) => {
    io.on('connection', async (socket: any) => {
        console.log('New client connected');
    
        // Send initial countdown value to the client
        socket.emit('countdown', countdown);
    
        // Start countdown if not already running
        if (!interval) {
            interval = setInterval(() => {
                countdown -= 1;
                if (countdown < 0) {
                    countdown = 175; // Reset countdown
                }

                let min =  getSecondsElapsedToday();

                io.emit('countdown',  min);
            }, 1000);
        }
    
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


const getSecondsElapsedToday = () => {
    const now: any = new Date();
    const startOfDay: any = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const secondsElapsed = Math.floor((now - startOfDay) / 1000);
    return 180 - secondsElapsed % 180;
};