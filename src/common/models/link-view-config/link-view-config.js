var immutable_1 = require('immutable');
var immutable_class_1 = require('immutable-class');
var general_1 = require('../../utils/general/general');
var link_item_1 = require('../link-item/link-item');
var check;
var LinkViewConfig = (function () {
    function LinkViewConfig(parameters) {
        this.title = parameters.title;
        this.linkItems = parameters.linkItems;
    }
    LinkViewConfig.isLinkViewConfig = function (candidate) {
        return immutable_class_1.isInstanceOf(candidate, LinkViewConfig);
    };
    LinkViewConfig.fromJS = function (parameters, context) {
        return new LinkViewConfig({
            title: parameters.title,
            linkItems: immutable_1.List(parameters.linkItems.map(function (linkItem) { return link_item_1.LinkItem.fromJS(linkItem, context); }))
        });
    };
    LinkViewConfig.prototype.valueOf = function () {
        return {
            title: this.title,
            linkItems: this.linkItems
        };
    };
    LinkViewConfig.prototype.toJS = function () {
        return {
            title: this.title,
            linkItems: this.linkItems.toArray().map(function (linkItem) { return linkItem.toJS(); })
        };
    };
    LinkViewConfig.prototype.toJSON = function () {
        return this.toJS();
    };
    LinkViewConfig.prototype.toString = function () {
        return "[LinkViewConfig: " + this.title + "]";
    };
    LinkViewConfig.prototype.equals = function (other) {
        return LinkViewConfig.isLinkViewConfig(other) &&
            this.title === other.title &&
            general_1.immutableListsEqual(this.linkItems, other.linkItems);
    };
    LinkViewConfig.prototype.defaultLinkItem = function () {
        return this.linkItems.first();
    };
    LinkViewConfig.prototype.findByName = function (name) {
        return this.linkItems.find(function (li) { return li.name === name; });
    };
    return LinkViewConfig;
})();
exports.LinkViewConfig = LinkViewConfig;
check = LinkViewConfig;
//# sourceMappingURL=link-view-config.js.map