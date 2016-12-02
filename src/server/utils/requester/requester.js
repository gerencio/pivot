var plywood_1 = require('plywood');
var plywood_druid_requester_1 = require('plywood-druid-requester');
function properDruidRequesterFactory(options) {
    var druidHost = options.druidHost, retry = options.retry, timeout = options.timeout, verbose = options.verbose, concurrentLimit = options.concurrentLimit, requestDecorator = options.requestDecorator;
    var druidRequester = plywood_druid_requester_1.druidRequesterFactory({
        host: druidHost,
        timeout: timeout || 30000,
        requestDecorator: requestDecorator
    });
    if (retry) {
        druidRequester = plywood_1.helper.retryRequesterFactory({
            requester: druidRequester,
            retry: retry,
            delay: 500,
            retryOnTimeout: false
        });
    }
    if (verbose) {
        druidRequester = plywood_1.helper.verboseRequesterFactory({
            requester: druidRequester
        });
    }
    if (concurrentLimit) {
        druidRequester = plywood_1.helper.concurrentLimitRequesterFactory({
            requester: druidRequester,
            concurrentLimit: concurrentLimit
        });
    }
    return druidRequester;
}
exports.properDruidRequesterFactory = properDruidRequesterFactory;
//# sourceMappingURL=requester.js.map