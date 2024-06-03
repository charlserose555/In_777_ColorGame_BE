import { getCurrentTodayInfo, getSecondsElapsedToday, getTodayGameId } from "../../util/util";
import { Request, Response } from 'express';
import { Server, Socket } from 'socket.io';
import { Users, WingoBetting, WingoTrans, BalanceHistory, BettingResult, PaymentSetting, BonusHistory, Bonus, UserWingoResult } from "../../models";
import { bool } from "joi";
import { max } from "lodash";
import { userInfo } from "../users";
let interval : any;
let min_1: any;
let min_3: any;
let min_5: any;
let min_10: any;

let initWinResult_min1 = false;
let initWinResult_min3 = false;
let initWinResult_min5 = false;
let initWinResult_min10 = false;

const gameType = ["1min", "3mins", "5mins", "10mins"];
const betType = ["Parity", "Spare", "Bcone", "Emerd"];

export const getGameId = async (req: Request, res: Response) => {
    const {data} = req.body;

    let timeInterval = 0;

    if(data.type == "1min") {
        timeInterval = 60
    } else if(data.type == "3mins") {
        timeInterval = 180
    } else if(data.type == "5mins") {
        timeInterval = 300
    } else if(data.type == "10mins") {
        timeInterval = 600
    } else {
        return res.status(400).json(`Not found gameId.`);
    }

    const gameId = getCurrentTodayInfo() + getTodayGameId(timeInterval);

    return res.json({data : gameId});
};

export const getBettingResults = async (req: Request, res: Response) => {
    const {data} = req.body;

    const perPage = 10;

    const bettingResult = await BettingResult.find({gameType: data.gameType, betType: data.betType}).sort({periodId: -1}).skip((data.page - 1) * perPage).limit(perPage);

    return res.json({data : bettingResult});
}

export const betColorGame = async (req: Request, res: Response) => {
    const {data} = req.body;
   
    if(data.gameType == '1min') {
        if(min_1 < 5) {
            return res.json({success: false, msg : "Bet Time out!"});
        }
    }
    if(data.gameType == '3mins') {
        if(min_3 < 30) {
            return res.json({success: false, msg : "Bet Time out!"});
        }
    }
    if(data.gameType == '5mins') {
        if(min_5 < 30) {
            return res.json({success: false, msg : "Bet Time out!"});
        }
    }
    if(data.gameType == '10mins') {
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

    let betting = new WingoBetting(data);

    await betting.save();

    let wingoTrans = new WingoTrans({
        email: data.email,
        transactionId: data.gamePeriod,
        amount: data.amount,
        type: "colorGame",
        status: "bet"
    });

    const tranResult = await wingoTrans.save();

    let balanceHisotory = new BalanceHistory({
        email: data.email,
        orderId: String(tranResult._id),
        amount: data.amount,
        type: "debit",
        actionType: "join"
    });

    await balanceHisotory.save();

    userInfo = await Users.findOneAndUpdate({
        email: data.email.toLowerCase()
    },  { $inc: { balance: -Number(data.amount.toFixed(2)) } }, { new: true });

    await applyBonusByLevel(userInfo, Number(data.amount), data.gamePeriod)

    return res.json({success: true, msg:"Your contract is completed successfully", data: Number(userInfo.balance).toFixed(2)});
};

const applyBonusByLevel = async (userInfo: any, tradeAmount: any, gameId: any) => {
    const bonusItem = await PaymentSetting.findOne({id: userInfo.vip});
    let level_1_Reward: number = tradeAmount * 0.02 * Number(Number(bonusItem.level1) / 100);
    let level_2_Reward: number = tradeAmount * 0.02 * Number(Number(bonusItem.level2) / 100);
    
    if(userInfo.rReferral != 0) {
        const userLevel_1 = await Users.findOne({'iReferral' : userInfo.rReferral});

        const level_1_Code = userLevel_1.rReferral;
        let level_2_email = "";
        if(level_1_Code != 0) {
            const userLevel_2 = await Users.findOne({'iReferral' : level_1_Code});
            level_2_email = userLevel_2.email;
        }
        
        console.log("userInfo.rReferral", level_1_Code)
        await new BonusHistory({
            email: userInfo.email,
            periodId : gameId,
            level1Email: userLevel_1.email,
            level2Email: level_2_email,
            level1Amount: level_1_Reward,
            level2Amount: level_2_Reward,
            tradeAmount: tradeAmount}).save();

        await Bonus.findOneAndUpdate({email : userLevel_1.email}, { $inc: { amount: Number(level_1_Reward.toFixed(2)), level1: Number(level_1_Reward.toFixed(2)) } })

        if(level_2_email)
            await Bonus.findOneAndUpdate({email : level_2_email}, { $inc: { amount: Number(level_2_Reward.toFixed(2)), level2: Number(level_2_Reward.toFixed(2)) } })
    }
}

export const getBettingRecords = async (req: Request, res: Response) => {
    const {data} = req.body;
    const perPage = 10;

    let waitingList = await WingoBetting.find({email: data.email, gameType: data.gameType, betType: data.betType})
    .sort({ createdAt: -1 }).skip((data.page - 1) * perPage).limit(perPage);

    let user = await Users.findOne({email : data.email});

    return res.json({success: true, data: waitingList, user: userInfo(user)});
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

                getWinnerTriggle();

                getCountDownTriggle();
                
                io.emit('countdown_1min',  min_1);
                io.emit('countdown_3mins',  min_3);
                io.emit('countdown_5mins',  min_5);
                io.emit('countdown_10mins',  min_10);
            }, 1000);
        }
    }

    const getCountDownTriggle = () => {
        if (min_1 == 60) {
            io.emit('countdown_init_1min')
            initWinResult_min1 = false
        }
    
        if (min_3 == 180) {
            io.emit('countdown_init_3mins')
            initWinResult_min3 = false
        }
    
        if (min_5 == 300) {
            io.emit('countdown_init_5mins')
            initWinResult_min5 = false
        }
    
        if (min_10 == 600) {
            io.emit('countdown_init_10mins')
            initWinResult_min10 = false
        }
    }
};


const getWinnerTriggle = () => {
    if(min_1 < 5) {
        if(!initWinResult_min1) {
            initWinResult_min1 = true;

            const gameId = getCurrentTodayInfo() + getTodayGameId(60);

            for(let i = 0; i < betType.length; i++) {
                getWinner(gameId, "1min", betType[i]);
            }
        }
    }

    if(min_3 < 30) {
        if(!initWinResult_min3) {
            initWinResult_min3 = true;

            const gameId = getCurrentTodayInfo() + getTodayGameId(180);

            for(let i = 0; i < betType.length; i++) {
                getWinner(gameId, "3mins", betType[i]);
            }
        }
    }

    if(min_5 < 30) {
        if(!initWinResult_min5) {
            initWinResult_min5 = true;

            const gameId = getCurrentTodayInfo() + getTodayGameId(300);

            for(let i = 0; i < betType.length; i++) {
                getWinner(gameId, "5mins", betType[i]);
            }
        }
    }

    if(min_10 < 30) {
        if(!initWinResult_min10) {
            initWinResult_min10 = true;

            const gameId = getCurrentTodayInfo() + getTodayGameId(600);

            for(let i = 0; i < betType.length; i++) {
                getWinner(gameId, "10mins", betType[i]);
            }
        }
    }
}

const getWinner = async (gamePeriod: String, gameType : any, betType: any) => {
    let color;
    let totalTradeAmount: number = 0;
    let greenTotalWinAmount: number = 0;
    let greenTotalWinAmountWithViolet: number = 0;
    let redTotalWinAmount: number = 0;
    let redTotalWinAmountWithViolet: number = 0;
    let violetTotalWinAmount: number = 0;
    let zeroWinAmount: number = 0;
    let oneWinAmount: number = 0;
    let twoWinAmount: number = 0;
    let threeWinAmount: number = 0;
    let fourWinAmount: number = 0;
    let fiveWinAmount: number = 0;
    let sixWinAmount: number = 0;
    let sevenWinAmount: number = 0;
    let eightWinAmount: number = 0;
    let nineWinAmount: number = 0;
    let minProfit: number = 0;
    let profitArray: number[] = [];
    let colorArray: String[] = [];
    
    const bettingResult = await WingoBetting.findOne({gamePeriod : gamePeriod, gameType: gameType, betType: betType});
    if(bettingResult) {
        const wingoBettings = await WingoBetting.find({gamePeriod: gamePeriod, gameType: gameType, betType: betType});

        if(wingoBettings && wingoBettings.length > 0){
            const sumbyBall = await WingoBetting.aggregate([
                {
                    $match: {
                        gamePeriod: gamePeriod,
                        gameType: gameType,
                        betType: betType
                    }
                },
                {
                    $group: {
                        _id: '$betValue',
                        ballSum: {
                            $sum: '$amount'
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        ball: '$_id',
                        ballSum: 1
                    }
                }
            ])

            const totalSum = await WingoBetting.aggregate([
                {
                    $match: {
                        gamePeriod: gamePeriod,
                        gameType: gameType,
                        betType: betType
                    }
                },
                {
                    $group: {
                        _id: 0,
                        totalSum: {
                            $sum: '$amount'
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalSum: 1
                    }
                }
            ])

            totalTradeAmount = totalSum[0].totalSum;

            console.log("totalTradeAmount", totalTradeAmount)

            for(let index = 0; index < sumbyBall.length; index++) {
                if(sumbyBall[index].ball == 'Green') {
                    greenTotalWinAmount = (sumbyBall[index].ballSum * 0.98) * 2;
                    greenTotalWinAmountWithViolet = (sumbyBall[index].ballSum * 0.98) * 1.5;
                } else if(sumbyBall[index].ball == 'Red') {
                    redTotalWinAmount = (sumbyBall[index].ballSum * 0.98) * 2;
                    redTotalWinAmountWithViolet = (sumbyBall[index].ballSum * 0.98) * 1.5;
                } else if(sumbyBall[index].ball == 'Violet') {
                    violetTotalWinAmount = (sumbyBall[index].ballSum * 0.98) * 4.5
                } else if(sumbyBall[index].ball == '0') {
                    zeroWinAmount = (sumbyBall[index].ballSum * 0.98) * 9;
                } else if(sumbyBall[index].ball == '1') {
                    oneWinAmount = (sumbyBall[index].ballSum * 0.98) * 9;
                } else if(sumbyBall[index].ball == '2') {
                    twoWinAmount = (sumbyBall[index].ballSum * 0.98) * 9;
                } else if(sumbyBall[index].ball == '3') {
                    threeWinAmount = (sumbyBall[index].ballSum * 0.98) * 9;
                } else if(sumbyBall[index].ball == '4') {
                    fourWinAmount = (sumbyBall[index].ballSum * 0.98) * 9;
                } else if(sumbyBall[index].ball == '5') {
                    fiveWinAmount = (sumbyBall[index].ballSum * 0.98) * 9;
                } else if(sumbyBall[index].ball == '6') {
                    sixWinAmount = (sumbyBall[index].ballSum * 0.98) * 9;
                } else if(sumbyBall[index].ball == '7') {
                    sevenWinAmount = (sumbyBall[index].ballSum * 0.98) * 9;
                } else if(sumbyBall[index].ball == '8') {
                    eightWinAmount = (sumbyBall[index].ballSum * 0.98) * 9;
                } else if(sumbyBall[index].ball == '9') {
                    nineWinAmount = (sumbyBall[index].ballSum * 0.98) * 9;
                }
            }
            
            for(let ballnumber = 0; ballnumber < 10; ballnumber++) {
                let color: String = "";
                let attr: number = 0;
                let profitAmount: number = 0;
                switch (ballnumber) {
                    case 1: {
                        color = "Green";
                        attr = greenTotalWinAmount + oneWinAmount
                        break;
                    };
                    case 3: {
                        color = "Green";
                        attr = greenTotalWinAmount + threeWinAmount
                        break;
                    };
                    case 7: {
                        color = "Green";
                        attr = greenTotalWinAmount + sevenWinAmount
                        break;
                    };
                    case 9: {
                        color = "Green";
                        attr = greenTotalWinAmount + nineWinAmount
                        break;
                    };
                    case 2: {
                        color = "Red";
                        attr = redTotalWinAmount + twoWinAmount
                        break;
                    };
                    case 4: {
                        color = "Red";
                        attr = redTotalWinAmount + fourWinAmount
                        break;
                    };
                    case 6: {
                        color = "Red";
                        attr = redTotalWinAmount + sixWinAmount
                        break;
                    };
                    case 8: {
                        color = "Red";
                        attr = redTotalWinAmount + eightWinAmount
                        break;
                    };
                    case 0: {
                        color = "Red+Violet";
                        attr = redTotalWinAmountWithViolet + violetTotalWinAmount + zeroWinAmount;
                        break;
                    };
                    case 5: {
                        color = "Green+Violet";
                        attr = greenTotalWinAmountWithViolet + violetTotalWinAmount + fiveWinAmount;
                        break;
                    };
                }

                profitAmount = Number((Number(totalTradeAmount) - Number(attr)).toFixed(2));

                profitArray.push(Number(profitAmount));
                colorArray.push(color);
            }

            console.log(...profitArray)

            let maxProfit = Math.max(...profitArray);
            let maxIndexes: any[] = profitArray.map((num, index) => num === maxProfit ? index : null).filter(index => index !== null);

            console.log("resultIndexs", ...maxIndexes);

            let number = maxIndexes[Math.floor(Math.random() * maxIndexes.length)];

            console.log(number)

            let resultColor: String = colorArray[number];

            let bettingResult = new BettingResult({
                periodId: gamePeriod,
                totalTradeAmount: totalTradeAmount,
                price: maxProfit,
                number: number,
                color: resultColor,
                gameType: gameType,
                betType: betType,
            })

            await bettingResult.save();
            
            console.log(...profitArray)
            
            await processByResult(gamePeriod, number, resultColor, gameType, betType);
        }
    }
}

const processByResult = async (gamePeriod:any, number:any, resultColor:any, gameType:any, betType:any) => {
    const bettingResults = await WingoBetting.find({gamePeriod: gamePeriod, gameType: gameType, betType: betType});

    for(let i = 0; i < bettingResults.length; i++) {
        let bet = bettingResults[i];
        let paidAmount: number = 0;

        if(!isNaN(Number(bet.betValue))) {
            if(number == Number(bet.betValue)) {
                paidAmount = Number((bet.amount * 0.98 * 9).toFixed(2));    
            }
        } else {
            if(String(resultColor).includes("+")) {
                let colors = resultColor.split('+');

                if(bet.betValue == colors[0]) {
                    paidAmount = Number((bet.amount * 0.98 * 9).toFixed(1.5));    
                } else if(bet.betValue == colors[1]){
                    paidAmount = Number((bet.amount * 0.98 * 9).toFixed(4.5));    
                }
            } else {
                if(bet.betValue == resultColor) {
                    paidAmount = Number((bet.amount * 0.98 * 2).toFixed(2));
                }
            }
        }

        if(paidAmount != 0) {
            let wingoTrans = new WingoTrans({
                email: bet.email,
                transactionId: bet.gamePeriod,
                amount: paidAmount,
                type: "colorGame",
                status: "win"
            });
        
            const tranResult = await wingoTrans.save();
            
            let balanceHisotory = new BalanceHistory({
                email:bet.email,
                orderId: String(tranResult._id),
                amount: paidAmount,
                type: "credit",
                actionType: "win"
            });
        
            await balanceHisotory.save();

            await Users.findOneAndUpdate({
                email: bet.email.toLowerCase()
            },  { $inc: { balance: Number(paidAmount.toFixed(2)) } }, { new: true });
        }
    }

    await WingoBetting.updateMany({gamePeriod: gamePeriod, gameType: gameType, betType: betType}, {resultNumber: number, resultColor:resultColor, status: "finished"});
}