var immutable_class_1 = require('immutable-class');
var external_view_1 = require('../external-view/external-view');
var check;
var Customization = (function () {
    function Customization(parameters) {
        this.title = parameters.title || null;
        this.headerBackground = parameters.headerBackground || null;
        this.customLogoSvg = parameters.customLogoSvg || null;
        if (parameters.externalViews)
            this.externalViews = parameters.externalViews;
    }
    Customization.isCustomization = function (candidate) {
        return immutable_class_1.isInstanceOf(candidate, Customization);
    };
    Customization.fromJS = function (parameters) {
        var value = {
            title: parameters.title,
            headerBackground: parameters.headerBackground,
            customLogoSvg: parameters.customLogoSvg
        };
        var paramViewsJS = parameters.externalViews;
        var externalViews = null;
        if (Array.isArray(paramViewsJS)) {
            externalViews = paramViewsJS.map(function (view, i) { return external_view_1.ExternalView.fromJS(view); });
            value.externalViews = externalViews;
        }
        return new Customization(value);
    };
    Customization.prototype.valueOf = function () {
        return {
            title: this.title,
            headerBackground: this.headerBackground,
            customLogoSvg: this.customLogoSvg,
            externalViews: this.externalViews
        };
    };
    Customization.prototype.toJS = function () {
        var js = {};
        if (this.title)
            js.title = this.title;
        if (this.headerBackground)
            js.headerBackground = this.headerBackground;
        if (this.customLogoSvg)
            js.customLogoSvg = this.customLogoSvg;
        if (this.externalViews) {
            js.externalViews = this.externalViews.map(function (view) { return view.toJS(); });
        }
        return js;
    };
    Customization.prototype.toJSON = function () {
        return this.toJS();
    };
    Customization.prototype.toString = function () {
        return "[custom: (" + this.headerBackground + ") logo: " + Boolean(this.customLogoSvg) + ", externalViews: " + Boolean(this.externalViews) + "]";
    };
    Customization.prototype.equals = function (other) {
        return Customization.isCustomization(other) &&
            this.title === other.title &&
            this.headerBackground === other.headerBackground &&
            this.customLogoSvg === other.customLogoSvg &&
            immutable_class_1.immutableArraysEqual(this.externalViews, other.externalViews);
    };
    return Customization;
})();
exports.Customization = Customization;
check = Customization;
//# sourceMappingURL=customization.js.map