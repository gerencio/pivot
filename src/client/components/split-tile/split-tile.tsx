require('./split-tile.css');

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SvgIcon } from '../svg-icon/svg-icon';
import { STRINGS, CORE_ITEM_WIDTH, CORE_ITEM_GAP } from '../../config/constants';
import { Stage, Clicker, Essence, VisStrategy, DataSource, Filter, SplitCombine, Dimension, DragPosition } from '../../../common/models/index';
import { findParentWithClass, setDragGhost, transformStyle, getXFromEvent, classNames } from '../../utils/dom/dom';
import { DragManager } from '../../utils/drag-manager/drag-manager';
import { FancyDragIndicator } from '../fancy-drag-indicator/fancy-drag-indicator';
import { SplitMenu } from '../split-menu/split-menu';

const SPLIT_CLASS_NAME = 'split';

export interface SplitTileProps extends React.Props<any> {
  clicker: Clicker;
  essence: Essence;
  menuStage: Stage;
  getUrlPrefix?: () => string;
}

export interface SplitTileState {
  SplitMenuAsync?: typeof SplitMenu;
  menuOpenOn?: Element;
  menuDimension?: Dimension;
  menuSplit?: SplitCombine;
  dragPosition?: DragPosition;
}

export class SplitTile extends React.Component<SplitTileProps, SplitTileState> {

  constructor() {
    super();
    this.state = {
      SplitMenuAsync: null,
      menuOpenOn: null,
      menuDimension: null,
      dragPosition: null
    };
  }

  componentDidMount() {
    require.ensure(['../split-menu/split-menu'], (require) => {
      this.setState({
        SplitMenuAsync: require('../split-menu/split-menu').SplitMenu
      });
    }, 'split-menu');
  }

  selectDimensionSplit(dimension: Dimension, split: SplitCombine, e: MouseEvent) {
    var target = findParentWithClass(e.target as Element, SPLIT_CLASS_NAME);
    this.openMenu(dimension, split, target);
  }

  openMenu(dimension: Dimension, split: SplitCombine, target: Element) {
    var { menuOpenOn } = this.state;
    if (menuOpenOn === target) {
      this.closeMenu();
      return;
    }
    this.setState({
      menuOpenOn: target,
      menuDimension: dimension,
      menuSplit: split
    });
  }

  closeMenu() {
    var { menuOpenOn } = this.state;
    if (!menuOpenOn) return;
    this.setState({
      menuOpenOn: null,
      menuDimension: null,
      menuSplit: null
    });
  }

  removeSplit(split: SplitCombine, e: MouseEvent) {
    var { clicker } = this.props;
    clicker.removeSplit(split, VisStrategy.FairGame);
    this.closeMenu();
    e.stopPropagation();
  }

  dragStart(dimension: Dimension, split: SplitCombine, splitIndex: number, e: DragEvent) {
    var { essence, getUrlPrefix } = this.props;

    var dataTransfer = e.dataTransfer;
    dataTransfer.effectAllowed = 'all';

    if (getUrlPrefix) {
      var newUrl = essence.changeSplit(SplitCombine.fromExpression(dimension.expression), VisStrategy.FairGame).getURL(getUrlPrefix());
      dataTransfer.setData("text/url-list", newUrl);
      dataTransfer.setData("text/plain", newUrl);
    }

    DragManager.setDragSplit(split, 'filter-tile');
    DragManager.setDragDimension(dimension, 'filter-tile');
    setDragGhost(dataTransfer, dimension.title);

    this.closeMenu();
  }

  calculateDragPosition(e: DragEvent): DragPosition {
    const { essence } = this.props;
    var numItems = essence.splits.length();
    var rect = ReactDOM.findDOMNode(this.refs['items']).getBoundingClientRect();
    var x = getXFromEvent(e);
    var offset = x - rect.left;
    return DragPosition.calculateFromOffset(offset, numItems, CORE_ITEM_WIDTH, CORE_ITEM_GAP);
  }

  canDrop(e: DragEvent): boolean {
    return Boolean(DragManager.getDragSplit() || DragManager.getDragDimension());
  }

  dragEnter(e: DragEvent) {
    if (!this.canDrop(e)) return;
    this.setState({
      dragPosition: this.calculateDragPosition(e)
    });
  }

  dragOver(e: DragEvent) {
    if (!this.canDrop(e)) return;
    e.dataTransfer.dropEffect = 'move';
    e.preventDefault();
    var dragPosition = this.calculateDragPosition(e);
    if (dragPosition.equals(this.state.dragPosition)) return;
    this.setState({ dragPosition });
  }

  dragLeave(e: DragEvent) {
    if (!this.canDrop(e)) return;
    this.setState({
      dragPosition: null
    });
  }

  drop(e: DragEvent) {
    if (!this.canDrop(e)) return;
    e.preventDefault();
    var { clicker, essence } = this.props;
    var { splits } = essence;

    var newSplitCombine: SplitCombine = null;
    if (DragManager.getDragSplit()) {
      newSplitCombine = DragManager.getDragSplit();
    } else if (DragManager.getDragDimension()) {
      newSplitCombine = SplitCombine.fromExpression(DragManager.getDragDimension().expression);
    }

    if (newSplitCombine) {
      var dragPosition = this.calculateDragPosition(e);
      if (dragPosition.isReplace()) {
        clicker.changeSplits(splits.replaceByIndex(dragPosition.replace, newSplitCombine), VisStrategy.FairGame);
      } else {
        clicker.changeSplits(splits.insertByIndex(dragPosition.insert, newSplitCombine), VisStrategy.FairGame);
      }
    }

    this.setState({
      dragPosition: null
    });
  }

  // This will be called externally
  splitMenuRequest(dimension: Dimension) {
    var { splits } = this.props.essence;
    var split = splits.findSplitForDimension(dimension);
    if (!split) return;
    var targetRef = this.refs[dimension.name];
    if (!targetRef) return;
    var target = ReactDOM.findDOMNode(targetRef);
    if (!target) return;
    this.openMenu(dimension, split, target);
  }

  renderMenu(): JSX.Element {
    var { essence, clicker, menuStage } = this.props;
    var { SplitMenuAsync, menuOpenOn, menuDimension, menuSplit } = this.state;
    if (!SplitMenuAsync || !menuDimension) return null;
    var onClose = this.closeMenu.bind(this);

    return <SplitMenuAsync
      clicker={clicker}
      essence={essence}
      containerStage={menuStage}
      openOn={menuOpenOn}
      dimension={menuDimension}
      split={menuSplit}
      onClose={onClose}
    />;
  }

  render() {
    var { essence } = this.props;
    var { menuDimension, dragPosition } = this.state;
    var { dataSource, splits } = essence;

    var sectionWidth = CORE_ITEM_WIDTH + CORE_ITEM_GAP;

    var itemX = 0;
    var splitItems = splits.toArray().map((split, i) => {
      var dimension = split.getDimension(dataSource.dimensions);
      if (!dimension) throw new Error('dimension not found');
      var dimensionName = dimension.name;

      var style = transformStyle(itemX, 0);
      itemX += sectionWidth;

      var classNames = [
        SPLIT_CLASS_NAME,
        'type-' + dimension.className
      ];
      if (dimension === menuDimension) classNames.push('selected');
      return <div
        className={classNames.join(' ')}
        key={split.toKey()}
        ref={dimensionName}
        draggable={true}
        onClick={this.selectDimensionSplit.bind(this, dimension, split)}
        onDragStart={this.dragStart.bind(this, dimension, split, i)}
        style={style}
      >
        <div className="reading">{split.getTitle(dataSource.dimensions)}</div>
        <div className="remove" onClick={this.removeSplit.bind(this, split)}>
          <SvgIcon svg={require('../../icons/x.svg')}/>
        </div>
      </div>;
    }, this);

    return <div
      className="split-tile"
      onDragEnter={this.dragEnter.bind(this)}
    >
      <div className="title">{STRINGS.split}</div>
      <div className="items" ref="items">
        {splitItems}
      </div>
      {dragPosition ? <FancyDragIndicator dragPosition={dragPosition}/> : null}
      {dragPosition ? <div
        className="drag-mask"
        onDragOver={this.dragOver.bind(this)}
        onDragLeave={this.dragLeave.bind(this)}
        onDrop={this.drop.bind(this)}
      /> : null}
      {this.renderMenu()}
    </div>;
  }
}
