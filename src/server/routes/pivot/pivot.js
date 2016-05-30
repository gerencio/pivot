var express_1 = require('express');
var config_1 = require('../../config');
var views_1 = require('../../views');
var router = express_1.Router();
router.get('/', function (req, res, next) {
    var title = (config_1.CUSTOMIZATION && config_1.CUSTOMIZATION.title) ? config_1.CUSTOMIZATION.title : 'Pivot (%v)';
    req.dataSourceManager.getQueryableDataSources()
        .then(function (dataSources) {
        res.send(views_1.pivotLayout({
            version: config_1.VERSION,
            title: title.replace(/%v/g, config_1.VERSION),
            config: {
                version: config_1.VERSION,
                user: req.user,
                dataSources: dataSources.map(function (ds) { return ds.toClientDataSource(); }),
                linkViewConfig: config_1.LINK_VIEW_CONFIG,
                customization: config_1.CUSTOMIZATION
            }
        }));
    })
        .done();
});
module.exports = router;
//# sourceMappingURL=pivot.js.map