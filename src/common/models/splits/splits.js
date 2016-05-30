var immutable_1 = require('immutable');
var immutable_class_1 = require('immutable-class');
var chronoshift_1 = require('chronoshift');
var plywood_1 = require('plywood');
var general_1 = require('../../utils/general/general');
var time_1 = require('../../utils/time/time');
var split_combine_1 = require('../split-combine/split-combine');
var DEFAULT_GRANULARITY = chronoshift_1.Duration.fromJS('P1D');
function withholdSplit(splits, split, allowIndex) {
    return splits.filter(function (s, i) {
        return i === allowIndex || !s.equalsByExpression(split);
    });
}
function swapSplit(splits, split, other, allowIndex) {
    return splits.map(function (s, i) {
        return (i === allowIndex || !s.equalsByExpression(split)) ? s : other;
    });
}
var check;
var Splits = (function () {
    function Splits(parameters) {
        this.splitCombines = parameters;
    }
    Splits.isSplits = function (candidate) {
        return immutable_class_1.isInstanceOf(candidate, Splits);
    };
    Splits.fromSplitCombine = function (splitCombine) {
        return new Splits(immutable_1.List([splitCombine]));
    };
    Splits.fromJS = function (parameters, context) {
        if (!Array.isArray(parameters))
            parameters = [parameters];
        return new Splits(immutable_1.List(parameters.map(function (splitCombine) { return split_combine_1.SplitCombine.fromJS(splitCombine, context); })));
    };
    Splits.prototype.valueOf = function () {
        return this.splitCombines;
    };
    Splits.prototype.toJS = function () {
        return this.splitCombines.toArray().map(function (splitCombine) { return splitCombine.toJS(); });
    };
    Splits.prototype.toJSON = function () {
        return this.toJS();
    };
    Splits.prototype.toString = function () {
        return this.splitCombines.map(function (splitCombine) { return splitCombine.toString(); }).join(',');
    };
    Splits.prototype.equals = function (other) {
        return Splits.isSplits(other) &&
            general_1.immutableListsEqual(this.splitCombines, other.splitCombines);
    };
    Splits.prototype.replaceByIndex = function (index, replace) {
        var splitCombines = this.splitCombines;
        if (splitCombines.size === index)
            return this.insertByIndex(index, replace);
        var replacedSplit = splitCombines.get(index);
        splitCombines = splitCombines.map(function (s, i) { return i === index ? replace : s; });
        splitCombines = swapSplit(splitCombines, replace, replacedSplit, index);
        return new Splits(splitCombines);
    };
    Splits.prototype.insertByIndex = function (index, insert) {
        var splitCombines = this.splitCombines;
        splitCombines = splitCombines.splice(index, 0, insert);
        splitCombines = withholdSplit(splitCombines, insert, index);
        return new Splits(splitCombines);
    };
    Splits.prototype.addSplit = function (split) {
        var splitCombines = this.splitCombines;
        return this.insertByIndex(splitCombines.size, split);
    };
    Splits.prototype.removeSplit = function (split) {
        return new Splits(this.splitCombines.filter(function (s) { return s !== split; }));
    };
    Splits.prototype.changeSortAction = function (sort) {
        return new Splits(this.splitCombines.map(function (s) { return s.changeSortAction(sort); }));
    };
    Splits.prototype.getTitle = function (dimensions) {
        return this.splitCombines.map(function (s) { return s.getDimension(dimensions).title; }).join(', ');
    };
    Splits.prototype.length = function () {
        return this.splitCombines.size;
    };
    Splits.prototype.forEach = function (sideEffect, context) {
        return this.splitCombines.forEach(sideEffect, context);
    };
    Splits.prototype.get = function (index) {
        return this.splitCombines.get(index);
    };
    Splits.prototype.first = function () {
        return this.splitCombines.first();
    };
    Splits.prototype.last = function () {
        return this.splitCombines.last();
    };
    Splits.prototype.findSplitForDimension = function (dimension) {
        var dimensionExpression = dimension.expression;
        return this.splitCombines.find(function (s) { return s.expression.equals(dimensionExpression); });
    };
    Splits.prototype.hasSplitOn = function (dimension) {
        return Boolean(this.findSplitForDimension(dimension));
    };
    Splits.prototype.replace = function (search, replace) {
        return new Splits(this.splitCombines.map(function (s) { return s.equals(search) ? replace : s; }));
    };
    Splits.prototype.map = function (mapper, context) {
        return new Splits(this.splitCombines.map(mapper, context));
    };
    Splits.prototype.toArray = function () {
        return this.splitCombines.toArray();
    };
    Splits.prototype.updateWithTimeRange = function (timeAttribute, timeRange, force) {
        var changed = false;
        var granularity = timeRange ? time_1.getBestGranularityDuration(timeRange) : DEFAULT_GRANULARITY;
        var newSplitCombines = this.splitCombines.map(function (splitCombine) {
            if (!splitCombine.expression.equals(timeAttribute))
                return splitCombine;
            var bucketAction = splitCombine.bucketAction;
            if (bucketAction) {
                if (!force)
                    return splitCombine;
                if (bucketAction instanceof plywood_1.TimeBucketAction && !bucketAction.duration.equals(granularity)) {
                    changed = true;
                    return splitCombine.changeBucketAction(new plywood_1.TimeBucketAction({
                        timezone: bucketAction.timezone,
                        duration: granularity
                    }));
                }
                else {
                    return splitCombine;
                }
            }
            else {
                changed = true;
                return splitCombine.changeBucketAction(new plywood_1.TimeBucketAction({
                    duration: granularity
                }));
            }
        });
        return changed ? new Splits(newSplitCombines) : this;
    };
    Splits.prototype.constrainToDimensions = function (dimensions) {
        var hasChanged = false;
        var splitCombines = [];
        this.splitCombines.forEach(function (split) {
            if (split.getDimension(dimensions)) {
                splitCombines.push(split);
            }
            else {
                hasChanged = true;
            }
        });
        return hasChanged ? new Splits(immutable_1.List(splitCombines)) : this;
    };
    Splits.prototype.timezoneDependant = function () {
        return this.splitCombines.some(function (splitCombine) { return splitCombine.timezoneDependant(); });
    };
    return Splits;
})();
exports.Splits = Splits;
check = Splits;
Splits.EMPTY = new Splits(immutable_1.List());
//# sourceMappingURL=splits.js.map