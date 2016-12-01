var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
require('./time-filter-menu.css');
var React = require('react');
var chronoshift_1 = require('chronoshift');
var plywood_1 = require('plywood');
var constants_1 = require('../../config/constants');
var index_1 = require('../../../common/models/index');
var time_1 = require('../../../common/utils/time/time');
var dom_1 = require('../../utils/dom/dom');
var button_1 = require('../button/button');
var button_group_1 = require('../button-group/button-group');
var date_range_picker_1 = require('../date-range-picker/date-range-picker');
var $maxTime = plywood_1.$(index_1.FilterClause.MAX_TIME_REF_NAME);
var latestPresets = [
    { name: '1H', selection: $maxTime.timeRange('PT1H', -1) },
    { name: '6H', selection: $maxTime.timeRange('PT6H', -1) },
    { name: '1D', selection: $maxTime.timeRange('P1D', -1) },
    { name: '7D', selection: $maxTime.timeRange('P1D', -7) },
    { name: '30D', selection: $maxTime.timeRange('P1D', -30) }
];
var $now = plywood_1.$(index_1.FilterClause.NOW_REF_NAME);
var currentPresets = [
    { name: 'D', selection: $now.timeBucket('P1D') },
    { name: 'W', selection: $now.timeBucket('P1W') },
    { name: 'M', selection: $now.timeBucket('P1M') },
    { name: 'Q', selection: $now.timeBucket('P3M') },
    { name: 'Y', selection: $now.timeBucket('P1Y') }
];
var previousPresets = [
    { name: 'D', selection: $now.timeFloor('P1D').timeRange('P1D', -1) },
    { name: 'W', selection: $now.timeFloor('P1W').timeRange('P1W', -1) },
    { name: 'M', selection: $now.timeFloor('P1M').timeRange('P1M', -1) },
    { name: 'Q', selection: $now.timeFloor('P3M').timeRange('P3M', -1) },
    { name: 'Y', selection: $now.timeFloor('P1Y').timeRange('P1Y', -1) }
];
var TimeFilterMenu = (function (_super) {
    __extends(TimeFilterMenu, _super);
    function TimeFilterMenu() {
        _super.call(this);
        this.state = {
            tab: null,
            timeSelection: null,
            startTime: null,
            endTime: null,
            hoverPreset: null
        };
        this.globalKeyDownListener = this.globalKeyDownListener.bind(this);
    }
    TimeFilterMenu.prototype.componentWillMount = function () {
        var _a = this.props, essence = _a.essence, dimension = _a.dimension;
        var filter = essence.filter;
        var timezone = essence.timezone;
        var timeSelection = filter.getSelection(dimension.expression);
        var selectedTimeRange = essence.evaluateSelection(timeSelection);
        this.setState({
            timeSelection: timeSelection,
            tab: filter.isRelative() ? 'relative' : 'specific',
            startTime: selectedTimeRange ? chronoshift_1.day.floor(selectedTimeRange.start, timezone) : null,
            endTime: selectedTimeRange ? chronoshift_1.day.ceil(selectedTimeRange.end, timezone) : null
        });
    };
    TimeFilterMenu.prototype.componentDidMount = function () {
        window.addEventListener('keydown', this.globalKeyDownListener);
    };
    TimeFilterMenu.prototype.componentWillUnmount = function () {
        window.removeEventListener('keydown', this.globalKeyDownListener);
    };
    TimeFilterMenu.prototype.globalKeyDownListener = function (e) {
        if (dom_1.enterKey(e)) {
            this.onOkClick();
        }
    };
    TimeFilterMenu.prototype.constructFilter = function () {
        var _a = this.props, essence = _a.essence, dimension = _a.dimension;
        var _b = this.state, tab = _b.tab, startTime = _b.startTime, endTime = _b.endTime;
        var filter = essence.filter;
        var timezone = essence.timezone;
        if (tab !== 'specific')
            return null;
        if (startTime && !endTime) {
            endTime = chronoshift_1.day.shift(startTime, timezone, 1);
        }
        if (startTime && endTime && startTime < endTime) {
            return filter.setSelection(dimension.expression, plywood_1.r(plywood_1.TimeRange.fromJS({ start: startTime, end: endTime })));
        }
        else {
            return null;
        }
    };
    TimeFilterMenu.prototype.onPresetClick = function (preset) {
        var _a = this.props, clicker = _a.clicker, onClose = _a.onClose;
        clicker.changeTimeSelection(preset.selection);
        onClose();
    };
    TimeFilterMenu.prototype.onPresetMouseEnter = function (preset) {
        var hoverPreset = this.state.hoverPreset;
        if (hoverPreset === preset)
            return;
        this.setState({
            hoverPreset: preset
        });
    };
    TimeFilterMenu.prototype.onPresetMouseLeave = function (preset) {
        var hoverPreset = this.state.hoverPreset;
        if (hoverPreset !== preset)
            return;
        this.setState({
            hoverPreset: null
        });
    };
    TimeFilterMenu.prototype.onStartChange = function (start) {
        this.setState({
            startTime: start
        });
    };
    TimeFilterMenu.prototype.onEndChange = function (end) {
        this.setState({
            endTime: end
        });
    };
    TimeFilterMenu.prototype.selectTab = function (tab) {
        this.setState({ tab: tab });
    };
    TimeFilterMenu.prototype.onOkClick = function () {
        if (!this.actionEnabled())
            return;
        var _a = this.props, clicker = _a.clicker, onClose = _a.onClose;
        var newFilter = this.constructFilter();
        if (!newFilter)
            return;
        clicker.changeFilter(newFilter);
        onClose();
    };
    TimeFilterMenu.prototype.onCancelClick = function () {
        var onClose = this.props.onClose;
        onClose();
    };
    TimeFilterMenu.prototype.renderPresets = function () {
        var _this = this;
        var _a = this.props, essence = _a.essence, dimension = _a.dimension;
        var _b = this.state, timeSelection = _b.timeSelection, hoverPreset = _b.hoverPreset;
        if (!dimension)
            return null;
        var timezone = essence.timezone;
        var presetToButton = function (preset) {
            return <button key={preset.name} className={dom_1.classNames('preset', { hover: preset === hoverPreset, selected: preset.selection.equals(timeSelection) })} onClick={_this.onPresetClick.bind(_this, preset)} onMouseEnter={_this.onPresetMouseEnter.bind(_this, preset)} onMouseLeave={_this.onPresetMouseLeave.bind(_this, preset)}>{preset.name}</button>;
        };
        var previewTimeRange = essence.evaluateSelection(hoverPreset ? hoverPreset.selection : timeSelection);
        var previewText = time_1.formatTimeRange(previewTimeRange, timezone, time_1.DisplayYear.IF_DIFF);
        return <div className="cont">
      <div className="type">{constants_1.STRINGS.latest}</div>
      <div className="buttons">{latestPresets.map(presetToButton)}</div>
      <div className="type">{constants_1.STRINGS.current}</div>
      <div className="buttons">{currentPresets.map(presetToButton)}</div>
      <div className="type">{constants_1.STRINGS.previous}</div>
      <div className="buttons">{previousPresets.map(presetToButton)}</div>
      <div className="preview">{previewText}</div>
    </div>;
    };
    TimeFilterMenu.prototype.actionEnabled = function () {
        var essence = this.props.essence;
        var tab = this.state.tab;
        if (tab !== 'specific')
            return false;
        var newFilter = this.constructFilter();
        return newFilter && !essence.filter.equals(newFilter);
    };
    TimeFilterMenu.prototype.renderCustom = function () {
        var _a = this.props, essence = _a.essence, dimension = _a.dimension;
        var _b = this.state, timeSelection = _b.timeSelection, startTime = _b.startTime, endTime = _b.endTime;
        if (!dimension)
            return null;
        if (!timeSelection)
            return null;
        var timezone = essence.timezone;
        return <div>
      <date_range_picker_1.DateRangePicker startTime={startTime} endTime={endTime} maxTime={new Date(essence.evaluateSelection($maxTime).toString())} timezone={timezone} onStartChange={this.onStartChange.bind(this)} onEndChange={this.onEndChange.bind(this)}/>
      <div className="button-bar">
        <button_1.Button type="primary" onClick={this.onOkClick.bind(this)} disabled={!this.actionEnabled()} title={constants_1.STRINGS.ok}/>
        <button_1.Button type="secondary" onClick={this.onCancelClick.bind(this)} title={constants_1.STRINGS.cancel}/>
      </div>
    </div>;
    };
    ;
    TimeFilterMenu.prototype.render = function () {
        var _this = this;
        var dimension = this.props.dimension;
        var tab = this.state.tab;
        if (!dimension)
            return null;
        var tabs = ['relative', 'specific'].map(function (name) {
            return {
                isSelected: tab === name,
                title: (name === 'relative' ? constants_1.STRINGS.relative : constants_1.STRINGS.specific),
                key: name,
                onClick: _this.selectTab.bind(_this, name)
            };
        });
        return <div className="time-filter-menu">
      <button_group_1.ButtonGroup groupMembers={tabs}/>
      {tab === 'relative' ? this.renderPresets() : this.renderCustom()}
    </div>;
    };
    return TimeFilterMenu;
})(React.Component);
exports.TimeFilterMenu = TimeFilterMenu;
//# sourceMappingURL=time-filter-menu.js.map