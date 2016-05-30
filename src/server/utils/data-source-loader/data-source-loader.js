var path = require('path');
var fs = require('fs-promise');
var Q = require('q');
var plywood_1 = require('plywood');
var index_1 = require('../../../common/models/index');
var parser_1 = require('../../../common/utils/parser/parser');
function getFileData(filePath) {
    return fs.readFile(filePath, 'utf-8')
        .then(function (fileData) {
        try {
            return parser_1.parseData(fileData, path.extname(filePath));
        }
        catch (e) {
            throw new Error("could not parse '" + filePath + "': " + e.message);
        }
    })
        .then(function (fileJSON) {
        fileJSON.forEach(function (d) {
            d['time'] = new Date(d['time']);
        });
        return fileJSON;
    });
}
exports.getFileData = getFileData;
function dataSourceLoaderFactory(druidRequester, configDirectory, timeout, introspectionStrategy) {
    return function (dataSource) {
        switch (dataSource.engine) {
            case 'native':
                // Do not do anything if the file was already loaded
                if (dataSource.executor)
                    return Q(dataSource);
                if (!configDirectory) {
                    throw new Error('Must have a config directory');
                }
                var filePath = path.resolve(configDirectory, dataSource.source);
                return getFileData(filePath)
                    .then(function (rawData) {
                    var dataset = plywood_1.Dataset.fromJS(rawData).hide();
                    if (dataSource.subsetFilter) {
                        dataset = dataset.filter(dataSource.subsetFilter.getFn(), {});
                    }
                    var executor = plywood_1.basicExecutorFactory({
                        datasets: { main: dataset }
                    });
                    return dataSource.addAttributes(dataset.attributes).attachExecutor(executor);
                });
            case 'druid':
                return dataSource.createExternal(druidRequester, introspectionStrategy, timeout).introspect()
                    .then(function (dataSourceWithExternal) {
                    if (dataSourceWithExternal.shouldUpdateMaxTime()) {
                        return index_1.DataSource.updateMaxTime(dataSourceWithExternal);
                    }
                    else {
                        return dataSourceWithExternal;
                    }
                });
            default:
                throw new Error("Invalid engine: '" + dataSource.engine + "' in '" + dataSource.name + "'");
        }
    };
}
exports.dataSourceLoaderFactory = dataSourceLoaderFactory;
//# sourceMappingURL=data-source-loader.js.map