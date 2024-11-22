const Router = require('koa-router');
const fixtures = require('./routes/fixtures.js');
const requests = require('./routes/requests.js');
const validations = require('./routes/validations.js');
const users = require('./routes/users.js');
const transactions = require('./routes/transactions.js');
const recommendations = require('./routes/recommendations.js');
const auctions = require('./routes/auctions.js');
const proposals = require('./routes/proposals.js');

const router = new Router();

router.use('/fixtures', fixtures.routes());
router.use('/requests', requests.routes());
router.use('/validations', validations.routes());
router.use('/users', users.routes());
router.use('/transactions', transactions.routes());
router.use('/recommendations', recommendations.routes());
router.use('/auctions', auctions.routes());
router.use('/proposals', proposals.routes());

module.exports = router;
