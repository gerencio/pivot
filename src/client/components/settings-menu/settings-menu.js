var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
require('./settings-menu.css');
var React = require('react');
var chronoshift_1 = require('chronoshift');
var index_1 = require('../../../common/models/index');
var constants_1 = require('../../config/constants');
var bubble_menu_1 = require('../bubble-menu/bubble-menu');
var dropdown_1 = require('../dropdown/dropdown');
var WallTime = require('chronoshift').WallTime;
if (!WallTime.rules) {
    var tzData = require("chronoshift/lib/walltime/walltime-data.js");
    WallTime.init(tzData.rules, tzData.zones);
}
/*
 some fun timezones

 new Timezone("Pacific/Niue"), // -11.0
 new Timezone("Pacific/Marquesas"), // -9.5
 new Timezone("America/Tijuana"), // -8.0
 new Timezone("America/St_Johns"), // -3.5
 new Timezone("Asia/Kathmandu"), // +5.8
 new Timezone("Australia/Broken_Hill"), // +9.5
 new Timezone("Pacific/Kiritimati") // +14.0

 */
var TIMEZONES = [
    new chronoshift_1.Timezone("America/Juneau"),
    new chronoshift_1.Timezone("America/Los_Angeles"),
    new chronoshift_1.Timezone("America/Yellowknife"),
    new chronoshift_1.Timezone("America/Phoenix"),
    new chronoshift_1.Timezone("America/Denver"),
    new chronoshift_1.Timezone("America/Mexico_City"),
    new chronoshift_1.Timezone("America/Chicago"),
    new chronoshift_1.Timezone("America/New_York"),
    new chronoshift_1.Timezone("America/Sao_Paulo"),
    new chronoshift_1.Timezone("America/Argentina/Buenos_Aires"),
    chronoshift_1.Timezone.UTC,
    new chronoshift_1.Timezone("Asia/Jerusalem"),
    new chronoshift_1.Timezone("Europe/Paris"),
    new chronoshift_1.Timezone("Asia/Kathmandu"),
    new chronoshift_1.Timezone("Asia/Hong_Kong"),
    new chronoshift_1.Timezone("Pacific/Guam") // +10.0
];
var SettingsMenu = (function (_super) {
    __extends(SettingsMenu, _super);
    function SettingsMenu() {
        _super.call(this);
    }
    SettingsMenu.prototype.changeTimezone = function (newTimezone) {
        var _a = this.props, onClose = _a.onClose, changeTimezone = _a.changeTimezone;
        changeTimezone(newTimezone);
        onClose();
    };
    SettingsMenu.prototype.renderTimezonesDropdown = function () {
        var timezone = this.props.timezone;
        return React.createElement(dropdown_1.Dropdown, {
            label: constants_1.STRINGS.timezone,
            selectedItem: timezone,
            renderItem: function (d) { return d.toString().replace(/_/g, ' '); },
            items: TIMEZONES,
            onSelect: this.changeTimezone.bind(this)
        });
    };
    SettingsMenu.prototype.render = function () {
        var _a = this.props, openOn = _a.openOn, onClose = _a.onClose;
        var stage = index_1.Stage.fromSize(240, 200);
        return <bubble_menu_1.BubbleMenu className="settings-menu" direction="down" stage={stage} openOn={openOn} onClose={onClose}>
      {this.renderTimezonesDropdown()}
    </BubbleMenu>;
    };
    return SettingsMenu;
})(React.Component);
exports.SettingsMenu = SettingsMenu;
//# sourceMappingURL=settings-menu.js.map