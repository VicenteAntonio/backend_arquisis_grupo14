const Router = require('koa-router');
const fixtures = require('./routes/fixtures.js');
const requests = require('./routes/requests.js');
const validations = require('./routes/validations.js');
const users = require('./routes/users.js');

const router = new Router();

router.use('/fixtures', fixtures.routes());
router.use('/requests', requests.routes());
router.use('/validations', validations.routes());
router.use('/users', users.routes());

module.exports = router;