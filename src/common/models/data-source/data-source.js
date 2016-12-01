var Q = require('q');
var immutable_1 = require('immutable');
var immutable_class_1 = require('immutable-class');
var chronoshift_1 = require('chronoshift');
var plywood_1 = require('plywood');
var general_1 = require('../../utils/general/general');
var time_1 = require('../../utils/time/time');
var dimension_1 = require('../dimension/dimension');
var measure_1 = require('../measure/measure');
var filter_1 = require('../filter/filter');
var max_time_1 = require('../max-time/max-time');
var refresh_rule_1 = require('../refresh-rule/refresh-rule');
function formatTimeDiff(diff) {
    diff = Math.round(Math.abs(diff) / 1000); // turn to seconds
    if (diff < 60)
        return 'less than 1 minute';
    diff = Math.floor(diff / 60); // turn to minutes
    if (diff === 1)
        return '1 minute';
    if (diff < 60)
        return diff + ' minutes';
    diff = Math.floor(diff / 60); // turn to hours
    if (diff === 1)
        return '1 hour';
    if (diff <= 24)
        return diff + ' hours';
    diff = Math.floor(diff / 24); // turn to days
    return diff + ' days';
}
function makeUniqueDimensionList(dimensions) {
    var seen = {};
    return immutable_1.List(dimensions.filter(function (dimension) {
        var dimensionName = dimension.name.toLowerCase();
        if (seen[dimensionName])
            return false;
        seen[dimensionName] = 1;
        return true;
    }));
}
function makeUniqueMeasureList(measures) {
    var seen = {};
    return immutable_1.List(measures.filter(function (measure) {
        var measureName = measure.name.toLowerCase();
        if (seen[measureName])
            return false;
        seen[measureName] = 1;
        return true;
    }));
}
function measuresFromLongForm(longForm) {
    var metricColumn = longForm.metricColumn, values = longForm.values, possibleAggregates = longForm.possibleAggregates, titleNameTrim = longForm.titleNameTrim;
    var myPossibleAggregates = {};
    for (var agg in possibleAggregates) {
        if (!general_1.hasOwnProperty(possibleAggregates, agg))
            continue;
        myPossibleAggregates[agg] = plywood_1.Expression.fromJSLoose(possibleAggregates[agg]);
    }
    var measures = [];
    for (var _i = 0; _i < values.length; _i++) {
        var value = values[_i];
        var aggregates = value.aggregates;
        if (!Array.isArray(aggregates)) {
            throw new Error('must have aggregates in longForm value');
        }
        for (var _a = 0; _a < aggregates.length; _a++) {
            var aggregate = aggregates[_a];
            var myExpression = myPossibleAggregates[aggregate];
            if (!myExpression)
                throw new Error("can not find aggregate " + aggregate + " for value " + value.value);
            var name = general_1.makeUrlSafeName(aggregate + "_" + value.value);
            measures.push(new measure_1.Measure({
                name: name,
                title: general_1.makeTitle(titleNameTrim ? name.replace(titleNameTrim, '') : name),
                expression: myExpression.substitute(function (ex) {
                    if (ex instanceof plywood_1.RefExpression && ex.name === 'filtered') {
                        return plywood_1.$('main').filter(plywood_1.$(metricColumn).is(plywood_1.r(value.value)));
                    }
                    return null;
                })
            }));
        }
    }
    return measures;
}
function filterFromLongFrom(longForm) {
    var metricColumn = longForm.metricColumn, values = longForm.values;
    return plywood_1.$(metricColumn).in(values.map(function (v) { return v.value; }));
}
var check;
var DataSource = (function () {
    function DataSource(parameters) {
        var name = parameters.name;
        general_1.verifyUrlSafeName(name);
        this.name = name;
        this.title = parameters.title || general_1.makeTitle(name);
        this.engine = parameters.engine || 'druid';
        this.source = parameters.source || name;
        this.subsetFilter = parameters.subsetFilter;
        this.rollup = Boolean(parameters.rollup);
        this.options = parameters.options || {};
        this.introspection = parameters.introspection || DataSource.DEFAULT_INTROSPECTION;
        this.attributes = parameters.attributes || [];
        this.attributeOverrides = parameters.attributeOverrides || [];
        this.derivedAttributes = parameters.derivedAttributes;
        this.dimensions = parameters.dimensions || immutable_1.List([]);
        this.measures = parameters.measures || immutable_1.List([]);
        this.timeAttribute = parameters.timeAttribute;
        this.defaultTimezone = parameters.defaultTimezone;
        this.defaultFilter = parameters.defaultFilter;
        this.defaultDuration = parameters.defaultDuration;
        this.defaultSortMeasure = parameters.defaultSortMeasure;
        this.defaultPinnedDimensions = parameters.defaultPinnedDimensions;
        this.refreshRule = parameters.refreshRule;
        this.maxTime = parameters.maxTime;
        this.executor = parameters.executor;
        this.external = parameters.external;
        this._validateDefaults();
    }
    DataSource.isDataSource = function (candidate) {
        return immutable_class_1.isInstanceOf(candidate, DataSource);
    };
    DataSource.updateMaxTime = function (dataSource) {
        if (dataSource.refreshRule.isRealtime()) {
            return Q(dataSource.changeMaxTime(max_time_1.MaxTime.fromNow()));
        }
        var ex = plywood_1.ply().apply('maxTime', plywood_1.$('main').max(dataSource.timeAttribute));
        return dataSource.executor(ex).then(function (dataset) {
            var maxTimeDate = dataset.data[0]['maxTime'];
            if (!isNaN(maxTimeDate)) {
                return dataSource.changeMaxTime(max_time_1.MaxTime.fromDate(maxTimeDate));
            }
            return dataSource;
        });
    };
    DataSource.fromJS = function (parameters, context) {
        if (context === void 0) { context = {}; }
        var executor = context.executor, external = context.external;
        var engine = parameters.engine;
        var introspection = parameters.introspection;
        var attributeOverrideJSs = parameters.attributeOverrides;
        // Back compat.
        var options = parameters.options || {};
        if (options.skipIntrospection) {
            if (!introspection)
                introspection = 'none';
            delete options.skipIntrospection;
        }
        if (options.disableAutofill) {
            if (!introspection)
                introspection = 'no-autofill';
            delete options.disableAutofill;
        }
        if (options.attributeOverrides) {
            if (!attributeOverrideJSs)
                attributeOverrideJSs = options.attributeOverrides;
            delete options.attributeOverrides;
        }
        if (options.defaultSplitDimension) {
            options.defaultSplits = options.defaultSplitDimension;
            delete options.defaultSplitDimension;
        }
        // End Back compat.
        introspection = introspection || DataSource.DEFAULT_INTROSPECTION;
        if (DataSource.INTROSPECTION_VALUES.indexOf(introspection) === -1) {
            throw new Error("invalid introspection value " + introspection + ", must be one of " + DataSource.INTROSPECTION_VALUES.join(', '));
        }
        var refreshRule = parameters.refreshRule ? refresh_rule_1.RefreshRule.fromJS(parameters.refreshRule) : refresh_rule_1.RefreshRule.query();
        var maxTime = parameters.maxTime ? max_time_1.MaxTime.fromJS(parameters.maxTime) : null;
        if (!maxTime && refreshRule.isRealtime()) {
            maxTime = max_time_1.MaxTime.fromNow();
        }
        var timeAttributeName = parameters.timeAttribute;
        if (engine === 'druid' && !timeAttributeName) {
            timeAttributeName = '__time';
        }
        var timeAttribute = timeAttributeName ? plywood_1.$(timeAttributeName) : null;
        var attributeOverrides = plywood_1.AttributeInfo.fromJSs(attributeOverrideJSs || []);
        var attributes = plywood_1.AttributeInfo.fromJSs(parameters.attributes || []);
        var derivedAttributes = null;
        if (parameters.derivedAttributes) {
            derivedAttributes = plywood_1.helper.expressionLookupFromJS(parameters.derivedAttributes);
        }
        var dimensions = makeUniqueDimensionList((parameters.dimensions || []).map(function (d) { return dimension_1.Dimension.fromJS(d); }));
        var measures = makeUniqueMeasureList((parameters.measures || []).map(function (m) { return measure_1.Measure.fromJS(m); }));
        if (timeAttribute && !dimension_1.Dimension.getDimensionByExpression(dimensions, timeAttribute)) {
            dimensions = dimensions.unshift(new dimension_1.Dimension({
                name: timeAttributeName,
                expression: timeAttribute,
                kind: 'time'
            }));
        }
        var subsetFilter = parameters.subsetFilter ? plywood_1.Expression.fromJSLoose(parameters.subsetFilter) : null;
        var longForm = parameters.longForm;
        if (longForm) {
            measures = measures.concat(measuresFromLongForm(longForm));
            if (longForm.addSubsetFilter) {
                if (!subsetFilter)
                    subsetFilter = plywood_1.Expression.TRUE;
                subsetFilter = subsetFilter.and(filterFromLongFrom(longForm)).simplify();
            }
        }
        var value = {
            executor: null,
            name: parameters.name,
            title: parameters.title,
            engine: engine,
            source: parameters.source,
            subsetFilter: subsetFilter,
            rollup: parameters.rollup,
            options: options,
            introspection: introspection,
            attributeOverrides: attributeOverrides,
            attributes: attributes,
            derivedAttributes: derivedAttributes,
            dimensions: dimensions,
            measures: measures,
            timeAttribute: timeAttribute,
            defaultTimezone: parameters.defaultTimezone ? chronoshift_1.Timezone.fromJS(parameters.defaultTimezone) : DataSource.DEFAULT_TIMEZONE,
            defaultFilter: parameters.defaultFilter ? filter_1.Filter.fromJS(parameters.defaultFilter) : filter_1.Filter.EMPTY,
            defaultDuration: parameters.defaultDuration ? chronoshift_1.Duration.fromJS(parameters.defaultDuration) : DataSource.DEFAULT_DURATION,
            defaultSortMeasure: parameters.defaultSortMeasure || (measures.size ? measures.first().name : null),
            defaultPinnedDimensions: immutable_1.OrderedSet(parameters.defaultPinnedDimensions || []),
            refreshRule: refreshRule,
            maxTime: maxTime
        };
        if (external)
            value.external = external;
        if (executor)
            value.executor = executor;
        return new DataSource(value);
    };
    DataSource.prototype.valueOf = function () {
        var value = {
            name: this.name,
            title: this.title,
            engine: this.engine,
            source: this.source,
            subsetFilter: this.subsetFilter,
            rollup: this.rollup,
            options: this.options,
            introspection: this.introspection,
            attributeOverrides: this.attributeOverrides,
            attributes: this.attributes,
            derivedAttributes: this.derivedAttributes,
            dimensions: this.dimensions,
            measures: this.measures,
            timeAttribute: this.timeAttribute,
            defaultTimezone: this.defaultTimezone,
            defaultFilter: this.defaultFilter,
            defaultDuration: this.defaultDuration,
            defaultSortMeasure: this.defaultSortMeasure,
            defaultPinnedDimensions: this.defaultPinnedDimensions,
            refreshRule: this.refreshRule,
            maxTime: this.maxTime
        };
        if (this.executor)
            value.executor = this.executor;
        if (this.external)
            value.external = this.external;
        return value;
    };
    DataSource.prototype.toJS = function () {
        var js = {
            name: this.name,
            title: this.title,
            engine: this.engine,
            source: this.source,
            subsetFilter: this.subsetFilter ? this.subsetFilter.toJS() : null,
            introspection: this.introspection,
            dimensions: this.dimensions.toArray().map(function (dimension) { return dimension.toJS(); }),
            measures: this.measures.toArray().map(function (measure) { return measure.toJS(); }),
            defaultTimezone: this.defaultTimezone.toJS(),
            defaultFilter: this.defaultFilter.toJS(),
            defaultDuration: this.defaultDuration.toJS(),
            defaultSortMeasure: this.defaultSortMeasure,
            defaultPinnedDimensions: this.defaultPinnedDimensions.toArray(),
            refreshRule: this.refreshRule.toJS()
        };
        if (this.rollup)
            js.rollup = true;
        if (this.timeAttribute)
            js.timeAttribute = this.timeAttribute.name;
        if (this.attributeOverrides.length)
            js.attributeOverrides = plywood_1.AttributeInfo.toJSs(this.attributeOverrides);
        if (this.attributes.length)
            js.attributes = plywood_1.AttributeInfo.toJSs(this.attributes);
        if (this.derivedAttributes)
            js.derivedAttributes = plywood_1.helper.expressionLookupToJS(this.derivedAttributes);
        if (Object.keys(this.options).length)
            js.options = this.options;
        if (this.maxTime)
            js.maxTime = this.maxTime.toJS();
        return js;
    };
    DataSource.prototype.toJSON = function () {
        return this.toJS();
    };
    DataSource.prototype.toString = function () {
        return "[DataSource: " + this.name + "]";
    };
    DataSource.prototype.equals = function (other) {
        return this.equalsWithoutMaxTime(other) &&
            Boolean(this.maxTime) === Boolean(other.maxTime) &&
            (!this.maxTime || this.maxTime.equals(other.maxTime));
    };
    DataSource.prototype.equalsWithoutMaxTime = function (other) {
        return DataSource.isDataSource(other) &&
            this.name === other.name &&
            this.title === other.title &&
            this.engine === other.engine &&
            this.source === other.source &&
            immutable_class_1.immutableEqual(this.subsetFilter, other.subsetFilter) &&
            this.rollup === other.rollup &&
            JSON.stringify(this.options) === JSON.stringify(other.options) &&
            this.introspection === other.introspection &&
            immutable_class_1.immutableArraysEqual(this.attributeOverrides, other.attributeOverrides) &&
            immutable_class_1.immutableArraysEqual(this.attributes, other.attributes) &&
            immutable_class_1.immutableLookupsEqual(this.derivedAttributes, other.derivedAttributes) &&
            general_1.immutableListsEqual(this.dimensions, other.dimensions) &&
            general_1.immutableListsEqual(this.measures, other.measures) &&
            immutable_class_1.immutableEqual(this.timeAttribute, other.timeAttribute) &&
            this.defaultTimezone.equals(other.defaultTimezone) &&
            this.defaultFilter.equals(other.defaultFilter) &&
            this.defaultDuration.equals(other.defaultDuration) &&
            this.defaultSortMeasure === other.defaultSortMeasure &&
            this.defaultPinnedDimensions.equals(other.defaultPinnedDimensions) &&
            this.refreshRule.equals(other.refreshRule);
    };
    DataSource.prototype._validateDefaults = function () {
        var _a = this, measures = _a.measures, defaultSortMeasure = _a.defaultSortMeasure;
        if (defaultSortMeasure) {
            if (!measures.find(function (measure) { return measure.name === defaultSortMeasure; })) {
                throw new Error("can not find defaultSortMeasure '" + defaultSortMeasure + "' in data source '" + this.name + "'");
            }
        }
    };
    DataSource.prototype.getMainTypeContext = function () {
        var _a = this, attributes = _a.attributes, derivedAttributes = _a.derivedAttributes;
        if (!attributes)
            return null;
        var datasetType = {};
        for (var _i = 0; _i < attributes.length; _i++) {
            var attribute = attributes[_i];
            datasetType[attribute.name] = attribute;
        }
        for (var name in derivedAttributes) {
            datasetType[name] = {
                type: derivedAttributes[name].type
            };
        }
        return {
            type: 'DATASET',
            datasetType: datasetType
        };
    };
    DataSource.prototype.getIssues = function () {
        var _a = this, dimensions = _a.dimensions, measures = _a.measures;
        var mainTypeContext = this.getMainTypeContext();
        var issues = [];
        dimensions.forEach(function (dimension) {
            try {
                dimension.expression.referenceCheckInTypeContext(mainTypeContext);
            }
            catch (e) {
                issues.push("failed to validate dimension '" + dimension.name + "': " + e.message);
            }
        });
        var measureTypeContext = {
            type: 'DATASET',
            datasetType: {
                main: mainTypeContext
            }
        };
        measures.forEach(function (measure) {
            try {
                measure.expression.referenceCheckInTypeContext(measureTypeContext);
            }
            catch (e) {
                var message = e.message;
                // If we get here it is possible that the user has misunderstood what the meaning of a measure is and have tried
                // to do something like $volume / $volume. We detect this here by checking for a reference to $main
                // If there is no main reference raise a more informative issue.
                if (measure.expression.getFreeReferences().indexOf('main') === -1) {
                    message = 'measure must contain a $main reference';
                }
                issues.push("failed to validate measure '" + measure.name + "': " + message);
            }
        });
        return issues;
    };
    DataSource.prototype.createExternal = function (requester, introspectionStrategy, timeout) {
        if (this.engine !== 'druid')
            return; // Only Druid supported for now.
        var value = this.valueOf();
        var context = {
            timeout: timeout
        };
        if (this.introspection === 'none') {
            value.external = new plywood_1.DruidExternal({
                suppress: true,
                dataSource: this.source,
                rollup: this.rollup,
                timeAttribute: this.timeAttribute.name,
                customAggregations: this.options.customAggregations,
                attributes: plywood_1.AttributeInfo.override(this.deduceAttributes(), this.attributeOverrides),
                derivedAttributes: this.derivedAttributes,
                introspectionStrategy: introspectionStrategy,
                filter: this.subsetFilter,
                allowSelectQueries: true,
                context: context,
                requester: requester
            });
        }
        else {
            value.external = new plywood_1.DruidExternal({
                suppress: true,
                dataSource: this.source,
                rollup: this.rollup,
                timeAttribute: this.timeAttribute.name,
                attributeOverrides: this.attributeOverrides,
                derivedAttributes: this.derivedAttributes,
                customAggregations: this.options.customAggregations,
                introspectionStrategy: introspectionStrategy,
                filter: this.subsetFilter,
                allowSelectQueries: true,
                context: context,
                requester: requester
            });
        }
        return new DataSource(value);
    };
    DataSource.prototype.introspect = function () {
        var _this = this;
        var external = this.external;
        if (this.engine === 'native')
            return Q(this);
        if (!external)
            throw new Error("must have external to introspect in " + this.name);
        var countDistinctReferences = [];
        if (this.measures) {
            countDistinctReferences = [].concat.apply([], this.measures.toArray().map(function (measure) {
                return measure_1.Measure.getCountDistinctReferences(measure.expression);
            }));
        }
        return external.introspect()
            .then(function (introspectedExternal) {
            if (immutable_class_1.immutableArraysEqual(external.attributes, introspectedExternal.attributes))
                return _this;
            if (!countDistinctReferences) {
                var attributes = introspectedExternal.attributes;
                for (var _i = 0; _i < attributes.length; _i++) {
                    var attribute = attributes[_i];
                    // This is a metric that should really be a HLL
                    if (attribute.type === 'NUMBER' && countDistinctReferences.indexOf(attribute.name) !== -1) {
                        introspectedExternal = introspectedExternal.updateAttribute(plywood_1.AttributeInfo.fromJS({
                            name: attribute.name,
                            special: 'unique'
                        }));
                    }
                }
            }
            var value = _this.addAttributes(introspectedExternal.attributes).valueOf();
            value.external = introspectedExternal;
            value.executor = plywood_1.basicExecutorFactory({
                datasets: { main: introspectedExternal }
            });
            return new DataSource(value);
        });
    };
    DataSource.prototype.attachExecutor = function (executor) {
        var value = this.valueOf();
        value.executor = executor;
        return new DataSource(value);
    };
    DataSource.prototype.toClientDataSource = function () {
        var value = this.valueOf();
        // Do not reveal the subset filter to the client
        value.subsetFilter = null;
        // No need for any introspection on the client
        value.introspection = 'none';
        // No point sending over the maxTime
        if (this.refreshRule.isRealtime()) {
            value.maxTime = null;
        }
        // No need for the overrides
        value.attributeOverrides = null;
        return new DataSource(value);
    };
    DataSource.prototype.isQueryable = function () {
        return Boolean(this.executor);
    };
    DataSource.prototype.getMaxTimeDate = function () {
        var refreshRule = this.refreshRule;
        if (refreshRule.isFixed())
            return refreshRule.time;
        // refreshRule is query or realtime
        var maxTime = this.maxTime;
        if (!maxTime)
            return null;
        return chronoshift_1.second.ceil(maxTime.time, chronoshift_1.Timezone.UTC);
    };
    DataSource.prototype.updatedText = function () {
        var refreshRule = this.refreshRule;
        if (refreshRule.isRealtime()) {
            return 'Updated ~1 second ago';
        }
        else if (refreshRule.isFixed()) {
            return "Fixed to " + time_1.getWallTimeString(refreshRule.time, this.defaultTimezone, true);
        }
        else {
            var maxTime = this.maxTime;
            if (maxTime) {
                return "Updated " + formatTimeDiff(Date.now() - maxTime.time.valueOf()) + " ago";
            }
            else {
                return null;
            }
        }
    };
    DataSource.prototype.shouldUpdateMaxTime = function () {
        if (!this.refreshRule.shouldUpdate(this.maxTime))
            return false;
        return Boolean(this.executor) || this.refreshRule.isRealtime();
    };
    DataSource.prototype.getDimension = function (dimensionName) {
        return dimension_1.Dimension.getDimension(this.dimensions, dimensionName);
    };
    DataSource.prototype.getDimensionByExpression = function (expression) {
        return dimension_1.Dimension.getDimensionByExpression(this.dimensions, expression);
    };
    DataSource.prototype.getDimensionByKind = function (kind) {
        return this.dimensions.filter(function (d) { return d.kind === kind; });
    };
    DataSource.prototype.getTimeDimension = function () {
        return this.getDimensionByExpression(this.timeAttribute);
    };
    DataSource.prototype.isTimeAttribute = function (ex) {
        return ex.equals(this.timeAttribute);
    };
    DataSource.prototype.getMeasure = function (measureName) {
        return measure_1.Measure.getMeasure(this.measures, measureName);
    };
    DataSource.prototype.getMeasureByExpression = function (expression) {
        return this.measures.find(function (measure) { return measure.expression.equals(expression); });
    };
    DataSource.prototype.changeDimensions = function (dimensions) {
        var value = this.valueOf();
        value.dimensions = dimensions;
        return new DataSource(value);
    };
    DataSource.prototype.rolledUp = function () {
        return this.engine === 'druid';
    };
    /**
     * This function tries to deduce the structure of the dataSource based on the dimensions and measures defined within.
     * It should only be used when, for some reason, introspection if not available.
     */
    DataSource.prototype.deduceAttributes = function () {
        var _a = this, dimensions = _a.dimensions, measures = _a.measures, timeAttribute = _a.timeAttribute, attributeOverrides = _a.attributeOverrides;
        var attributes = [];
        if (timeAttribute) {
            attributes.push(plywood_1.AttributeInfo.fromJS({ name: timeAttribute.name, type: 'TIME' }));
        }
        dimensions.forEach(function (dimension) {
            var expression = dimension.expression;
            if (expression.equals(timeAttribute))
                return;
            var references = expression.getFreeReferences();
            for (var _i = 0; _i < references.length; _i++) {
                var reference = references[_i];
                if (plywood_1.helper.findByName(attributes, reference))
                    continue;
                attributes.push(plywood_1.AttributeInfo.fromJS({ name: reference, type: 'STRING' }));
            }
        });
        measures.forEach(function (measure) {
            var expression = measure.expression;
            var references = measure_1.Measure.getAggregateReferences(expression);
            var countDistinctReferences = measure_1.Measure.getCountDistinctReferences(expression);
            for (var _i = 0; _i < references.length; _i++) {
                var reference = references[_i];
                if (plywood_1.helper.findByName(attributes, reference))
                    continue;
                if (countDistinctReferences.indexOf(reference) !== -1) {
                    attributes.push(plywood_1.AttributeInfo.fromJS({ name: reference, special: 'unique' }));
                }
                else {
                    attributes.push(plywood_1.AttributeInfo.fromJS({ name: reference, type: 'NUMBER' }));
                }
            }
        });
        if (attributeOverrides.length) {
            attributes = plywood_1.AttributeInfo.override(attributes, attributeOverrides);
        }
        return attributes;
    };
    DataSource.prototype.addAttributes = function (newAttributes) {
        var _this = this;
        var _a = this, introspection = _a.introspection, dimensions = _a.dimensions, measures = _a.measures, attributes = _a.attributes;
        if (introspection === 'none')
            return this;
        var autofillDimensions = introspection === 'autofill-dimensions-only' || introspection === 'autofill-all';
        var autofillMeasures = introspection === 'autofill-measures-only' || introspection === 'autofill-all';
        var $main = plywood_1.$('main');
        for (var _i = 0; _i < newAttributes.length; _i++) {
            var newAttribute = newAttributes[_i];
            var name = newAttribute.name, type = newAttribute.type, special = newAttribute.special;
            // Already exists
            if (attributes && plywood_1.helper.findByName(attributes, name))
                continue;
            var expression;
            switch (type) {
                case 'TIME':
                    if (!autofillDimensions)
                        continue;
                    expression = plywood_1.$(name);
                    if (this.getDimensionByExpression(expression))
                        continue;
                    // Add to the start
                    dimensions = dimensions.unshift(new dimension_1.Dimension({
                        name: general_1.makeUrlSafeName(name),
                        kind: 'time',
                        expression: expression
                    }));
                    break;
                case 'STRING':
                    if (special === 'unique' || special === 'theta') {
                        if (!autofillMeasures)
                            continue;
                        var newMeasures = measure_1.Measure.measuresFromAttributeInfo(newAttribute);
                        newMeasures.forEach(function (newMeasure) {
                            if (_this.getMeasureByExpression(newMeasure.expression))
                                return;
                            measures = measures.push(newMeasure);
                        });
                    }
                    else {
                        if (!autofillDimensions)
                            continue;
                        expression = plywood_1.$(name);
                        if (this.getDimensionByExpression(expression))
                            continue;
                        dimensions = dimensions.push(new dimension_1.Dimension({
                            name: general_1.makeUrlSafeName(name),
                            expression: expression
                        }));
                    }
                    break;
                case 'SET/STRING':
                    if (!autofillDimensions)
                        continue;
                    expression = plywood_1.$(name);
                    if (this.getDimensionByExpression(expression))
                        continue;
                    dimensions = dimensions.push(new dimension_1.Dimension({
                        name: general_1.makeUrlSafeName(name),
                        expression: expression
                    }));
                    break;
                case 'BOOLEAN':
                    if (!autofillDimensions)
                        continue;
                    expression = plywood_1.$(name);
                    if (this.getDimensionByExpression(expression))
                        continue;
                    dimensions = dimensions.push(new dimension_1.Dimension({
                        name: general_1.makeUrlSafeName(name),
                        kind: 'boolean',
                        expression: expression
                    }));
                    break;
                case 'NUMBER':
                    if (!autofillMeasures)
                        continue;
                    var newMeasures = measure_1.Measure.measuresFromAttributeInfo(newAttribute);
                    newMeasures.forEach(function (newMeasure) {
                        if (_this.getMeasureByExpression(newMeasure.expression))
                            return;
                        measures = (name === 'count') ? measures.unshift(newMeasure) : measures.push(newMeasure);
                    });
                    break;
                default:
                    throw new Error("unsupported type " + type);
            }
        }
        if (!this.rolledUp() && !measures.find(function (m) { return m.name === 'count'; })) {
            measures = measures.unshift(new measure_1.Measure({
                name: 'count',
                expression: $main.count()
            }));
        }
        var value = this.valueOf();
        value.attributes = attributes ? plywood_1.AttributeInfo.override(attributes, newAttributes) : newAttributes;
        value.dimensions = dimensions;
        value.measures = measures;
        if (!value.defaultSortMeasure) {
            value.defaultSortMeasure = measures.size ? measures.first().name : null;
        }
        // ToDo: remove this when Pivot can handle it
        if (!value.timeAttribute && dimensions.first().kind === 'time') {
            value.timeAttribute = dimensions.first().expression;
        }
        return new DataSource(value);
    };
    DataSource.prototype.changeMaxTime = function (maxTime) {
        var value = this.valueOf();
        value.maxTime = maxTime;
        return new DataSource(value);
    };
    DataSource.prototype.getDefaultSortAction = function () {
        return new plywood_1.SortAction({
            expression: plywood_1.$(this.defaultSortMeasure),
            direction: plywood_1.SortAction.DESCENDING
        });
    };
    DataSource.DEFAULT_INTROSPECTION = 'autofill-all';
    DataSource.INTROSPECTION_VALUES = ['none', 'no-autofill', 'autofill-dimensions-only', 'autofill-measures-only', 'autofill-all'];
    DataSource.DEFAULT_TIMEZONE = chronoshift_1.Timezone.UTC;
    DataSource.DEFAULT_DURATION = chronoshift_1.Duration.fromJS('P1D');
    return DataSource;
})();
exports.DataSource = DataSource;
check = DataSource;
//# sourceMappingURL=data-source.js.map