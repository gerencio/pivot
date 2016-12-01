var immutable_class_1 = require('immutable-class');
var check;
var Stage = (function () {
    function Stage(parameters) {
        this.x = parameters.x;
        this.y = parameters.y;
        this.width = parameters.width;
        this.height = parameters.height;
    }
    Stage.isStage = function (candidate) {
        return immutable_class_1.isInstanceOf(candidate, Stage);
    };
    Stage.fromJS = function (parameters) {
        return new Stage({
            x: parameters.x,
            y: parameters.y,
            width: parameters.width,
            height: parameters.height
        });
    };
    Stage.fromClientRect = function (rect) {
        return new Stage({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        });
    };
    Stage.fromSize = function (width, height) {
        return new Stage({
            x: 0,
            y: 0,
            width: width,
            height: height
        });
    };
    Stage.prototype.valueOf = function () {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    };
    Stage.prototype.toJS = function () {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    };
    Stage.prototype.toJSON = function () {
        return this.toJS();
    };
    Stage.prototype.sizeOnlyValue = function () {
        return {
            x: 0,
            y: 0,
            width: this.width,
            height: this.height
        };
    };
    Stage.prototype.toString = function () {
        return "[stage: " + this.width + "x" + this.height + "}]";
    };
    Stage.prototype.equals = function (other) {
        return Stage.isStage(other) &&
            this.x === other.x &&
            this.y === other.y &&
            this.width === other.width &&
            this.height === other.height;
    };
    Stage.prototype.getTransform = function () {
        return "translate(" + this.x + "," + this.y + ")";
    };
    Stage.prototype.getViewBox = function () {
        return "0 0 " + this.width + " " + this.height;
    };
    Stage.prototype.getLeftTop = function () {
        return {
            left: this.x,
            top: this.y
        };
    };
    Stage.prototype.getWidthHeight = function () {
        return {
            width: this.width,
            height: this.height
        };
    };
    Stage.prototype.getLeftTopWidthHeight = function () {
        return {
            left: this.x,
            top: this.y,
            width: this.width,
            height: this.height
        };
    };
    Stage.prototype.within = function (param) {
        var value = this.sizeOnlyValue();
        var left = param.left, right = param.right, top = param.top, bottom = param.bottom;
        if (left) {
            value.x = left;
            value.width -= left;
        }
        if (right) {
            value.width -= right;
        }
        if (top) {
            value.y = top;
            value.height -= top;
        }
        if (bottom) {
            value.height -= bottom;
        }
        return new Stage(value);
    };
    return Stage;
})();
exports.Stage = Stage;
check = Stage;
//# sourceMappingURL=stage.js.map