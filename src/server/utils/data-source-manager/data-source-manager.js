var Q = require('q');
var plywood_1 = require('plywood');
var general_1 = require('../../../common/utils/general/general');
var index_1 = require('../../../common/models/index');
"disable" | "auto";
function dataSourceManagerFactory(options) {
    var dataSources = options.dataSources, dataSourceStubFactory = options.dataSourceStubFactory, druidRequester = options.druidRequester, dataSourceLoader = options.dataSourceLoader, pageMustLoadTimeout = options.pageMustLoadTimeout, sourceListScan = options.sourceListScan, sourceListRefreshOnLoad = options.sourceListRefreshOnLoad, sourceListRefreshInterval = options.sourceListRefreshInterval, sourceReintrospectOnLoad = options.sourceReintrospectOnLoad, sourceReintrospectInterval = options.sourceReintrospectInterval, log = options.log;
    if (!pageMustLoadTimeout)
        pageMustLoadTimeout = 800;
    if (!sourceListScan)
        sourceListScan = 'auto';
    if (sourceListScan !== 'disable' && sourceListScan !== 'auto') {
        throw new Error("sourceListScan must be disable or auto is ('" + sourceListScan + "')");
    }
    if (!dataSourceStubFactory) {
        dataSourceStubFactory = function (source) {
            return index_1.DataSource.fromJS({
                name: general_1.makeUrlSafeName(source),
                engine: 'druid',
                source: source,
                refreshRule: index_1.RefreshRule.query().toJS()
            });
        };
    }
    if (!log)
        log = function () { };
    var myDataSources = dataSources || [];
    function findDataSource(name) {
        return plywood_1.helper.findByName(myDataSources, name);
    }
    function getQueryable() {
        return myDataSources.filter(function (dataSource) { return dataSource.isQueryable(); });
    }
    // Updates the correct datasource (by name) in myDataSources
    function addOrUpdateDataSource(dataSource) {
        myDataSources = plywood_1.helper.overrideByName(myDataSources, dataSource);
    }
    function loadAndIntrospectDataSource(dataSource) {
        return loadDataSource(dataSource)
            .then(introspectDataSource);
    }
    function loadDataSource(dataSource) {
        return dataSourceLoader(dataSource)
            .then(function (loadedDataSource) {
            addOrUpdateDataSource(loadedDataSource);
            return loadedDataSource;
        })
            .catch(function (e) {
            log("Failed to load data source: '" + dataSource.name + "' because " + e.message);
            throw e;
        });
    }
    function introspectDataSource(dataSource, doLog) {
        if (doLog === void 0) { doLog = false; }
        return dataSource.introspect()
            .then(function (introspectedDataSource) {
            if (introspectedDataSource !== dataSource) {
                if (doLog)
                    log("loaded new schema for " + dataSource.name);
                addOrUpdateDataSource(introspectedDataSource);
                var issues = introspectedDataSource.getIssues();
                if (issues.length) {
                    log("Data source '" + introspectedDataSource.name + "' has the following issues:");
                    log('- ' + issues.join('\n- ') + '\n');
                }
            }
            return introspectedDataSource;
        })
            .catch(function (e) {
            log("Failed to introspect data source: '" + dataSource.name + "' because " + e.message);
            throw e;
        });
    }
    function introspectDataSources() {
        return Q.allSettled(getQueryable().map(function (dataSource) {
            return introspectDataSource(dataSource, true);
        }));
    }
    function loadDruidDataSources() {
        if (!druidRequester)
            return Q(null);
        return plywood_1.DruidExternal.getSourceList(druidRequester)
            .then(function (ds) {
            if (!Array.isArray(ds))
                throw new Error('invalid result from data source list');
            var unknownDataSourceNames = [];
            var nonQueryableDataSources = [];
            ds.forEach(function (d) {
                var existingDataSources = myDataSources.filter(function (dataSource) {
                    return dataSource.engine === 'druid' && dataSource.source === d;
                });
                if (existingDataSources.length === 0) {
                    unknownDataSourceNames.push(d);
                }
                else {
                    nonQueryableDataSources = nonQueryableDataSources.concat(existingDataSources.filter(function (dataSource) {
                        return !dataSource.isQueryable();
                    }));
                }
            });
            nonQueryableDataSources = nonQueryableDataSources.concat(unknownDataSourceNames.map(function (source) {
                var newDataSource = dataSourceStubFactory(source);
                log("Adding Druid data source: '" + source + "'");
                addOrUpdateDataSource(newDataSource);
                return newDataSource;
            }));
            // Nothing to do
            if (!nonQueryableDataSources.length)
                return Q(null);
            return Q.allSettled(nonQueryableDataSources.map(loadAndIntrospectDataSource));
        })
            .catch(function (e) {
            log("Could not get druid source list: " + e.message);
        });
    }
    // First concurrently introspect all the defined data sources
    var initialLoad = Q.allSettled(myDataSources.map(loadAndIntrospectDataSource));
    // Then (if needed) scan for more data sources
    if (sourceListScan === 'auto' && druidRequester) {
        initialLoad = initialLoad.then(loadDruidDataSources);
    }
    // Then print out an update
    initialLoad.then(function () {
        var queryableDataSources = getQueryable();
        log("Initial load and introspection complete. Got " + myDataSources.length + " data sources, " + queryableDataSources.length + " queryable");
    });
    if (sourceListScan === 'auto' && druidRequester && sourceListRefreshInterval) {
        log("Will refresh data source list every " + sourceListRefreshInterval + "ms");
        setInterval(loadDruidDataSources, sourceListRefreshInterval).unref();
    }
    if (druidRequester && sourceReintrospectInterval) {
        log("Will re-introspect data sources every " + sourceReintrospectInterval + "ms");
        setInterval(introspectDataSources, sourceReintrospectInterval).unref();
    }
    // Periodically check if max time needs to be updated
    setInterval(function () {
        myDataSources.forEach(function (dataSource) {
            if (dataSource.refreshRule.isQuery() && dataSource.shouldUpdateMaxTime()) {
                index_1.DataSource.updateMaxTime(dataSource).then(function (updatedDataSource) {
                    log("Getting the latest MaxTime for '" + updatedDataSource.name + "'");
                    addOrUpdateDataSource(updatedDataSource);
                });
            }
        });
    }, 1000).unref();
    function onLoadTasks() {
        var tasks = [];
        if (sourceListRefreshOnLoad) {
            tasks.push(loadDruidDataSources());
        }
        if (sourceReintrospectOnLoad) {
            tasks.push(introspectDataSources());
        }
        return Q.allSettled(tasks)
            .timeout(pageMustLoadTimeout)
            .catch(function () {
            log("pageMustLoadTimeout (" + pageMustLoadTimeout + ") exceeded, loading anyways.");
            return null;
        });
    }
    return {
        getDataSources: function () {
            return initialLoad.then(function () {
                if (myDataSources.length && !sourceListRefreshOnLoad && !sourceReintrospectOnLoad)
                    return myDataSources;
                // There are no data sources... lets try to load some:
                return onLoadTasks().then(function () {
                    return myDataSources; // we tried
                });
            });
        },
        getQueryableDataSources: function () {
            return initialLoad.then(function () {
                var queryableDataSources = getQueryable();
                if (queryableDataSources.length && !sourceListRefreshOnLoad && !sourceReintrospectOnLoad)
                    return queryableDataSources;
                // There are no data sources... lets try to load some:
                return onLoadTasks().then(function () {
                    return getQueryable(); // we tried
                });
            });
        },
        getQueryableDataSource: function (name) {
            return initialLoad.then(function () {
                var myDataSource = findDataSource(name);
                if (myDataSource) {
                    if (myDataSource.isQueryable())
                        return myDataSource;
                    return introspectDataSource(myDataSource).then(function () {
                        var queryableDataSource = findDataSource(name);
                        return (queryableDataSource && queryableDataSource.isQueryable()) ? queryableDataSource : null;
                    });
                }
                // There are no data sources... lets try to load some:
                return loadDruidDataSources().then(function () {
                    var queryableDataSource = findDataSource(name);
                    return (queryableDataSource && queryableDataSource.isQueryable()) ? queryableDataSource : null;
                });
            });
        }
    };
}
exports.dataSourceManagerFactory = dataSourceManagerFactory;
//# sourceMappingURL=data-source-manager.js.map