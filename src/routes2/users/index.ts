import routerx from 'express-promise-router';
import rateLimit from 'express-rate-limit';
import { Validator, V } from '../../middlewares/validation';
import { checkUser, verifyToken } from '../../middlewares/auth';
import {
    changePassword,
    signin,
    signup,
    signout,
    passwordReset,
    verifyCode,
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
router.post('/bet', signup);

router.post('/verifyCode', loginLimiter, verifyCode);

router.post('/signout', V.body(Validator.UserId), signout);
router.post('/r-password', loginLimiter, V.body(Validator.Users.Auth.PasswordReset), passwordReset);
router.post('/c-password', loginLimiter, V.body(Validator.Users.Auth.ChangePassword), verifyToken, checkUser, changePassword);

export default router;
