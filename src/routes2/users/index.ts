import routerx from 'express-promise-router';
import rateLimit from 'express-rate-limit';
import { Validator, V } from '../../middlewares/validation';
import { checkUser, verifyToken } from '../../middlewares/auth';
import {
    changePassword,
    signin,
    signup,
    signout,
    getVIPLevelInfo,
    passwordReset,
    verifyCode,
    addBankCardInfo,
    getBankCardInfo,
    removeBankCardInfo,
    orderDepositAmount,
    getDepositOrderInfo,
    confirmDepositOrderInfo,
    orderWithDrawal,
    getBonusInfo,
    applyAllBonus,
    getDepositHistory,
    getWithDrawalHistory,
    getBonusHistory,
    getFriendInfo,
    getStatisticByUser,
    getUserInfo
} from '../../controllers/users';
const router = routerx();

const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100000,
    standardHeaders: true,
    legacyHeaders: false
});

const forgotLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false
});

if (process.env.MODE === 'dev') {
    router.post('/signin', loginLimiter, signin);
} else {
    router.post('/signin', loginLimiter, V.body(Validator.Users.Auth.Signin), signin);
}

router.post('/signup', loginLimiter, V.body(Validator.Users.Auth.Signup), signup);
router.post('/getVIPLevelInfo', getVIPLevelInfo);
router.post('/getUserInfo', getUserInfo);
router.post('/addBankCard', addBankCardInfo);
router.post('/getBankCard', getBankCardInfo);
router.post('/removeBankCard', removeBankCardInfo);
router.post('/orderDepositAmount', orderDepositAmount);
router.post('/getDepositOrderInfo', getDepositOrderInfo);
router.post('/confirmRefNo', confirmDepositOrderInfo);
router.post('/orderWithDrawal', orderWithDrawal);
router.post('/getBonusInfo', getBonusInfo);
router.post('/applyAllBonus', applyAllBonus);
router.post('/getDepositHistory', getDepositHistory);
router.post('/getWithDrawalHistory', getWithDrawalHistory);
router.post('/getBonusHistory', getBonusHistory);
router.post('/getFriendInfo', getFriendInfo);
router.post('/getStatisticByUser', getStatisticByUser);
router.post('/verifyCode', loginLimiter, verifyCode);
router.post('/signout', V.body(Validator.UserId), signout);
router.post('/r-password', loginLimiter, V.body(Validator.Users.Auth.PasswordReset), passwordReset);
router.post('/c-password', loginLimiter, V.body(Validator.Users.Auth.ChangePassword), verifyToken, checkUser, changePassword);

export default router;
