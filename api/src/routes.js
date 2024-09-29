const Router = require('koa-router');
const fixtures = require('./routes/fixtures.js');

const router = new Router();

router.use('/fixtures', fixtures.routes());

module.exports = router;