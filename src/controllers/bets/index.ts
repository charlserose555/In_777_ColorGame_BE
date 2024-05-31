import { getCurrentTodayInfo, getSecondsElapsedToday, getTodayGameId } from "../../util/util";
import { Request, Response } from 'express';
import { Server, Socket } from 'socket.io';
import { Users, ColorBetting, ColorTransOrder, BalanceHistory } from "../../models";
let interval : any;
let min_1: any;
let min_3: any;
let min_5: any;
let min_10: any;

export const getGameId = async (req: Request, res: Response) => {
    const {data} = req.body;

    console.log("dataType", data);
    let timeInterval = 0;

    if(data.type == "1min") {
        timeInterval = 60
    } else if(data.type == "3min") {
        timeInterval = 180
    } else if(data.type == "5min") {
        timeInterval = 300
    } else if(data.type == "10min") {
        timeInterval = 600
    } else {
        return res.status(400).json(`Not found gameId.`);
    }

    const gameId = getCurrentTodayInfo() + getTodayGameId(timeInterval);

    return res.json({data : gameId});
};

export const betColorGame = async (req: Request, res: Response) => {
    const {data} = req.body;

    console.log("data", data);
    
    if(data.gameType == '1min') {
        if(min_1 < 5) {
            return res.json({success: false, msg : "Bet Time out!"});
        }
    }
    if(data.gameType == '3min') {
        if(min_3 < 30) {
            return res.json({success: false, msg : "Bet Time out!"});
        }
    }
    if(data.gameType == '5min') {
        if(min_5 < 30) {
            return res.json({success: false, msg : "Bet Time out!"});
        }
    }
    if(data.gameType == '10min') {
        if(min_10 < 30) {
            return res.json({success: false, msg : "Bet Time out!"});
        }
    }

    let userInfo = await Users.findOne({
        email: data.email.toLowerCase()
    });

    if(userInfo.balance < data.amount) {
        return res.json({success: false, msg : "Your balance is insufficient, please recharge"});
    }

    let betting = new ColorBetting(data);
    await betting.save();

    let colorTrans = new ColorTransOrder({
        email: data.email,
        transactionId: data.gamePeriod,
        amount: data.amout,
        type: "colorGame",
        status: 1
    });

    const tranResult = await colorTrans.save();

    let balanceHisotory = new BalanceHistory({
        email: data.email,
        orderId: String(tranResult._id),
        amount: data.amout,
        type: "debit",
        actionType: "join"
    });

    await balanceHisotory.save();

    userInfo = await Users.findOneAndUpdate({
        email: data.email.toLowerCase()
    },  { $inc: { balance: -Number(data.amount) } }, { new: true });

    console.log("result", userInfo);

    return res.json({success: true, msg:"Your contract is completed successfully", data: userInfo.balance});
};

export const getWaitingList = async (req: Request, res: Response) => {
    const {data} = req.body;

    console.log("data", data);
    
    let waitingList = await ColorBetting.find({email: data.email, gamePeriod: data.gamePeriod, gameType: data.gameType, betType: data.betType}).sort({ createdAt: -1 }).limit(480);

    console.log(waitingList);

    return res.json({success: true, msg:"Your contract is completed successfully", data: waitingList});
};


// Get socket.io instance
export const betListen = (io: Server): void => {   
    // Listen for new websocket connections
    io.of('/countDown').on('connection', (socket: Socket) => {
        emitCountDown(socket);
    });

    const emitCountDown = (socket: Socket) => {         
        // Start countdown if not already running
        if (!interval) {
            interval = setInterval(() => {              
                min_1 =  getSecondsElapsedToday(60);
                min_3 =  getSecondsElapsedToday(180);
                min_5 =  getSecondsElapsedToday(300);
                min_10 =  getSecondsElapsedToday(600);

                if (min_1 == 60) {
                    console.log("init_1min")
                    io.emit('countdown_init_1min')
                }

                if (min_3 == 180) {
                    console.log("init_3min")
                    io.emit('countdown_init_3min')
                }

                if (min_5 == 300) {
                    console.log("init_5min")
                    io.emit('countdown_init_5min')
                }

                if (min_10 == 600) {
                    console.log("init_10min")
                    io.emit('countdown_init_10min')
                }
                
                io.emit('countdown_1min',  min_1);
                io.emit('countdown_3min',  min_3);
                io.emit('countdown_5min',  min_5);
                io.emit('countdown_10min',  min_10);
            }, 1000);
        }
    }
};