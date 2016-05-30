var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var compress = require('compression');
var chronoshift_1 = require('chronoshift');
// Init chronoshift
if (!chronoshift_1.WallTime.rules) {
    var tzData = require("chronoshift/lib/walltime/walltime-data.js");
    chronoshift_1.WallTime.init(tzData.rules, tzData.zones);
}
var config_1 = require('./config');
var plywoodRoutes = require('./routes/plywood/plywood');
var plyqlRoutes = require('./routes/plyql/plyql');
var pivotRoutes = require('./routes/pivot/pivot');
var healthRoutes = require('./routes/health/health');
var views_1 = require('./views');
var serverRoot = '/pivot';
if (config_1.SERVER_ROOT) {
    var serverRoot = config_1.SERVER_ROOT;
    if (serverRoot[0] !== '/')
        serverRoot = '/' + serverRoot;
}
var app = express();
app.disable('x-powered-by');
app.use(compress());
app.use(logger('dev'));
app.use('/', express.static(path.join(__dirname, '../../build/public')));
app.use(serverRoot, express.static(path.join(__dirname, '../../build/public')));
app.use('/', express.static(path.join(__dirname, '../../assets')));
app.use(serverRoot, express.static(path.join(__dirname, '../../assets')));
if (config_1.AUTH) {
    app.use(config_1.AUTH.auth({
        version: config_1.VERSION,
        dataSourceManager: config_1.DATA_SOURCE_MANAGER
    }));
    app.use(function (req, res, next) {
        if (!req.dataSourceManager) {
            return next(new Error('no dataSourceManager'));
        }
        next();
    });
}
else {
    app.use(function (req, res, next) {
        req.user = null;
        req.dataSourceManager = config_1.DATA_SOURCE_MANAGER;
        next();
    });
}
app.use(bodyParser.json());
// Data routes
app.use('/plywood', plywoodRoutes);
app.use(serverRoot + '/plywood', plywoodRoutes);
app.use('/plyql', plyqlRoutes);
app.use(serverRoot + '/plyql', plyqlRoutes);
// View routes
if (config_1.SERVER_CONFIG.iframe === 'deny') {
    app.use(function (req, res, next) {
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
        next();
    });
}
app.use('/', pivotRoutes);
app.use(serverRoot, pivotRoutes);
app.use('/health', healthRoutes);
app.use(serverRoot + '/health', healthRoutes);
// Catch 404 and redirect to /
app.use(function (req, res, next) {
    res.redirect('/');
});
// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.send(views_1.errorLayout({ version: config_1.VERSION, title: 'Error' }, err.message, err));
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send(views_1.errorLayout({ version: config_1.VERSION, title: 'Error' }, err.message));
});
module.exports = app;
//# sourceMappingURL=app.js.map