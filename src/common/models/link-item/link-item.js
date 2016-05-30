var immutable_class_1 = require('immutable-class');
var general_1 = require('../../utils/general/general');
var essence_1 = require('../essence/essence');
var check;
var LinkItem = (function () {
    function LinkItem(parameters) {
        var name = parameters.name;
        general_1.verifyUrlSafeName(name);
        this.name = name;
        this.title = parameters.title || general_1.makeTitle(name);
        this.description = parameters.description || '';
        this.group = parameters.group;
        this.dataSource = parameters.dataSource;
        this.essence = parameters.essence;
    }
    LinkItem.isLinkItem = function (candidate) {
        return immutable_class_1.isInstanceOf(candidate, LinkItem);
    };
    LinkItem.fromJS = function (parameters, context) {
        if (!context)
            throw new Error('must have context');
        var dataSources = context.dataSources, visualizations = context.visualizations;
        var dataSourceName = parameters.dataSource;
        var dataSource = dataSources.find(function (d) { return d.name === dataSourceName; });
        if (!dataSource)
            throw new Error("can not find dataSource '" + dataSourceName + "'");
        var essence = essence_1.Essence.fromJS(parameters.essence, { dataSource: dataSource, visualizations: visualizations }).updateWithTimeRange();
        return new LinkItem({
            name: parameters.name,
            title: parameters.title,
            description: parameters.description,
            group: parameters.group,
            dataSource: dataSource,
            essence: essence
        });
    };
    LinkItem.prototype.valueOf = function () {
        return {
            name: this.name,
            title: this.title,
            description: this.description,
            group: this.group,
            dataSource: this.dataSource,
            essence: this.essence
        };
    };
    LinkItem.prototype.toJS = function () {
        return {
            name: this.name,
            title: this.title,
            description: this.description,
            group: this.group,
            dataSource: this.dataSource.name,
            essence: this.essence.toJS()
        };
    };
    LinkItem.prototype.toJSON = function () {
        return this.toJS();
    };
    LinkItem.prototype.toString = function () {
        return "[LinkItem: " + this.name + "]";
    };
    LinkItem.prototype.equals = function (other) {
        return LinkItem.isLinkItem(other) &&
            this.name === other.name &&
            this.title === other.title &&
            this.description === other.description &&
            this.group === other.group &&
            this.dataSource.equals(other.dataSource) &&
            this.essence.equals(other.essence);
    };
    return LinkItem;
})();
exports.LinkItem = LinkItem;
check = LinkItem;
//# sourceMappingURL=link-item.js.map