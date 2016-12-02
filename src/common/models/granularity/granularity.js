var plywood_1 = require('plywood');
var general_1 = require('../../../common/utils/general/general');
function granularityFromJS(input) {
    if (typeof input === 'number')
        return plywood_1.NumberBucketAction.fromJS({ size: input });
    if (typeof input === 'string')
        return plywood_1.TimeBucketAction.fromJS({ duration: input });
    if (typeof input === "object") {
        if (!general_1.hasOwnProperty(input, 'action')) {
            throw new Error("could not recognize object as action");
        }
        return plywood_1.Action.fromJS(input);
    }
    throw new Error("input should be of type number, string, or action");
}
exports.granularityFromJS = granularityFromJS;
function granularityToString(input) {
    if (input instanceof plywood_1.TimeBucketAction) {
        return input.duration.toString();
    }
    else if (input instanceof plywood_1.NumberBucketAction) {
        return input.size.toString();
    }
    throw new Error("unrecognized granularity: must be of type TimeBucketAction or NumberBucketAction");
}
exports.granularityToString = granularityToString;
function granularityEquals(g1, g2) {
    if (!Boolean(g1) === Boolean(g2))
        return false;
    if (g1 === g2)
        return true;
    return g1.equals(g2);
}
exports.granularityEquals = granularityEquals;
function granularityToJS(input) {
    var js = input.toJS();
    if (js.action === 'timeBucket') {
        if (Object.keys(js).length === 2)
            return js.duration;
    }
    if (js.action === 'numberBucket') {
        if (Object.keys(js).length === 2)
            return js.size;
    }
    return js;
}
exports.granularityToJS = granularityToJS;
//# sourceMappingURL=granularity.js.map