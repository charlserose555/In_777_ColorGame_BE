import routerx from 'express-promise-router';
import users from './users';
import bets from './bets';

const router = routerx();
router.use('/users', users);
router.use('/bets', bets);

export default router;
