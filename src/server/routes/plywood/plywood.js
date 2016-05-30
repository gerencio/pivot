var express_1 = require('express');
var plywood_1 = require('plywood');
var chronoshift_1 = require('chronoshift');
var config_1 = require('../../config');
var router = express_1.Router();
router.post('/', function (req, res) {
    var _a = req.body, version = _a.version, dataSource = _a.dataSource, expression = _a.expression, timezone = _a.timezone;
    if (version && version !== config_1.VERSION) {
        res.status(400).send({
            error: 'incorrect version',
            action: 'reload'
        });
        return;
    }
    if (typeof dataSource !== 'string') {
        res.status(400).send({
            error: 'must have a dataSource'
        });
        return;
    }
    var queryTimezone = null;
    if (typeof timezone === 'string') {
        try {
            queryTimezone = chronoshift_1.Timezone.fromJS(timezone);
        }
        catch (e) {
            res.status(400).send({
                error: 'bad timezone',
                message: e.message
            });
            return;
        }
    }
    var ex = null;
    try {
        ex = plywood_1.Expression.fromJS(expression);
    }
    catch (e) {
        res.status(400).send({
            error: 'bad expression',
            message: e.message
        });
        return;
    }
    req.dataSourceManager.getQueryableDataSource(dataSource)
        .then(function (myDataSource) {
        if (!myDataSource) {
            res.status(400).send({ error: 'unknown data source' });
            return;
        }
        return myDataSource.executor(ex, { timezone: queryTimezone }).then(function (data) {
            res.send(data.toJS());
        }, function (e) {
            console.log('error:', e.message);
            if (e.hasOwnProperty('stack')) {
                console.log(e.stack);
            }
            res.status(500).send({
                error: 'could not compute',
                message: e.message
            });
        });
    })
        .done();
});
module.exports = router;
//# sourceMappingURL=plywood.js.map