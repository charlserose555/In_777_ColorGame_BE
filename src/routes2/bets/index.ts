import routerx from 'express-promise-router';
import rateLimit from 'express-rate-limit';
import { Validator, V } from '../../middlewares/validation';
import { checkUser, verifyToken } from '../../middlewares/auth';
import {
    getGameId,
    betColorGame,
    getWaitingList
} from '../../controllers/bets';
const router = routerx();

const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100000,
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/getGameId', loginLimiter, getGameId);
router.post('/betColorGame', loginLimiter, betColorGame);
router.post('/getWaitingList', loginLimiter, getWaitingList);

export default router;
