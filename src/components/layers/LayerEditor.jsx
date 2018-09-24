  import React from 'react'
import PropTypes from 'prop-types'
import { Wrapper, Button, Menu, MenuItem } from 'react-aria-menubutton'

import JSONEditor from './JSONEditor'
import FilterEditor from '../filter/FilterEditor'
import PropertyGroup from '../fields/PropertyGroup'
import LayerEditorGroup from './LayerEditorGroup'
import LayerTypeBlock from './LayerTypeBlock'
import LayerIdBlock from './LayerIdBlock'
import MinZoomBlock from './MinZoomBlock'
import MaxZoomBlock from './MaxZoomBlock'
import CommentBlock from './CommentBlock'
import LayerSourceBlock from './LayerSourceBlock'
import LayerSourceLayerBlock from './LayerSourceLayerBlock'

import MoreVertIcon from 'react-icons/lib/md/more-vert'

import { changeType, changeProperty } from '../../libs/layer'
import layout from '../../config/layout.json'


function layoutGroups(layerType) {
  const layerGroup = {
    title: 'Layer',
    type: 'layer'
  }
  const filterGroup = {
    title: 'Filter',
    type: 'filter'
  }
  const editorGroup = {
    title: 'JSON Editor',
    type: 'jsoneditor'
  }

  if(layerType == "invalid") {
    return [
      {
        title: 'Layer',
        type: 'layer',
        fields: [
          "id", "type"
        ]
      }
    ].concat(layout[layerType].groups).concat([editorGroup])
  }
  else {
    return [layerGroup, filterGroup].concat(layout[layerType].groups).concat([editorGroup])
  }
}

/** Layer editor supporting multiple types of layers. */
export default class LayerEditor extends React.Component {
  static propTypes = {
    layer: PropTypes.object.isRequired,
    sources: PropTypes.object,
    vectorLayers: PropTypes.object,
    spec: PropTypes.object.isRequired,
    onLayerChanged: PropTypes.func,
    onLayerIdChange: PropTypes.func,
    onMoveLayer: PropTypes.func,
    onLayerDestroy: PropTypes.func,
    onLayerCopy: PropTypes.func,
    onLayerVisibilityToggle: PropTypes.func,
    isFirstLayer: PropTypes.bool,
    isLastLayer: PropTypes.bool,
    layerIndex: PropTypes.number,
  }

  static defaultProps = {
    onLayerChanged: () => {},
    onLayerIdChange: () => {},
    onLayerDestroyed: () => {},
  }

  static childContextTypes = {
    reactIconBase: PropTypes.object
  }

  constructor(props) {
    super(props)

    //TODO: Clean this up and refactor into function
    const editorGroups = {}
    layoutGroups(this.getType()).forEach(group => {
      editorGroups[group.title] = true
    })

    this.state = { editorGroups }
  }

  getType() {
    if(!layout.hasOwnProperty(this.props.layer.type)) {
      return "invalid";
    }
    else {
      return this.props.layer.type;
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const additionalGroups = { ...this.state.editorGroups }

    let type = nextProps.layer.type;
    if(!layout.hasOwnProperty(nextProps.layer.type)) {
      type = "invalid";
    }

    layout[type].groups.forEach(group => {
      if(!(group.title in additionalGroups)) {
        additionalGroups[group.title] = true
      }
    })

    return {
      editorGroups: additionalGroups
    };
  }

  getChildContext () {
    return {
      reactIconBase: {
        size: 14,
        color: '#8e8e8e',
      }
    }
  }

  changeProperty(group, property, newValue) {
    this.props.onLayerChanged(changeProperty(this.props.layer, group, property, newValue))
  }

  onGroupToggle(groupTitle, active) {
    const changedActiveGroups = {
      ...this.state.editorGroups,
      [groupTitle]: active,
    }
    this.setState({
      editorGroups: changedActiveGroups
    })
  }

  renderGroupType(type, fields) {
    let comment = ""
    if(this.props.layer.metadata) {
      comment = this.props.layer.metadata['maputnik:comment']
    }

    let sourceLayerIds;
    if(this.props.sources.hasOwnProperty(this.props.layer.source)) {
      sourceLayerIds = this.props.sources[this.props.layer.source].layers;
    }

    const layerFields = {
      id: (
        <LayerIdBlock
          value={this.props.layer.id}
          wdKey="layer-editor.layer-id"
          onChange={newId => this.props.onLayerIdChange(this.props.layer.id, newId)}
        />
      ),
      type: (
        <LayerTypeBlock
          value={this.getType()}
          onChange={newType => this.props.onLayerChanged(changeType(this.props.layer, newType))}
        />
      ),
      source: (
        this.getType() !== 'background' && <LayerSourceBlock
          sourceIds={Object.keys(this.props.sources)}
          value={this.props.layer.source}
          onChange={v => this.changeProperty(null, 'source', v)}
        />
      ),
      sourceLayer: (
        ['background', 'raster', 'hillshade', 'heatmap'].indexOf(this.state.type) < 0 &&
        <LayerSourceLayerBlock
          sourceLayerIds={sourceLayerIds}
          value={this.props.layer['source-layer']}
          onChange={v => this.changeProperty(null, 'source-layer', v)}
        />
      ),
      minZoom: (
        <MinZoomBlock
          value={this.props.layer.minzoom}
          onChange={v => this.changeProperty(null, 'minzoom', v)}
        />
      ),
      maxZoom: (
        <MaxZoomBlock
          value={this.props.layer.maxzoom}
          onChange={v => this.changeProperty(null, 'maxzoom', v)}
        />
      ),
      comment: (
        <CommentBlock
          value={comment}
          onChange={v => this.changeProperty('metadata', 'maputnik:comment', v == ""  ? undefined : v)}
        />
      )
    }
    if(type === "layer")  {
      fields = fields || Object.keys(layerFields)
    }

    switch(type) {
      case 'layer': return <div>
        {fields.map((id) => {
          return layerFields[id];
        })}
      </div>
      case 'filter': return <div>
        <div className="maputnik-filter-editor-wrapper">
          <FilterEditor
            filter={this.props.layer.filter}
            properties={this.props.vectorLayers[this.props.layer['source-layer']]}
            onChange={f => this.changeProperty(null, 'filter', f)}
          />
        </div>
      </div>
      case 'properties': return <PropertyGroup
        layer={this.props.layer}
        groupFields={fields}
        spec={this.props.spec}
        onChange={this.changeProperty.bind(this)}
      />
      case 'jsoneditor': return <JSONEditor
        layer={this.props.layer}
        onChange={this.props.onLayerChanged}
      />
    }
  }

  moveLayer(offset) {
    this.props.onMoveLayer({
      oldIndex: this.props.layerIndex,
      newIndex: this.props.layerIndex+offset
    })
  }

  render() {
    const layerType = this.getType()
    const groups = layoutGroups(layerType).filter(group => {
      return !(layerType === 'background' && group.type === 'source')
    }).map(group => {
      return <LayerEditorGroup
        data-wd-key={group.title}
        key={group.title}
        title={group.title}
        isActive={this.state.editorGroups[group.title]}
        onActiveToggle={this.onGroupToggle.bind(this, group.title)}
      >
        {this.renderGroupType(group.type, group.fields)}
      </LayerEditorGroup>
    })

    const layout = this.props.layer.layout || {}

    const items = {
      delete: {
        text: "Delete",
        handler: () => this.props.onLayerDestroy(this.props.layer.id)
      },
      duplicate: {
        text: "Duplicate",
        handler: () => this.props.onLayerCopy(this.props.layer.id)
      },
      hide: {
        text: (layout.visibility === "none") ? "Show" : "Hide",
        handler: () => this.props.onLayerVisibilityToggle(this.props.layer.id)
      },
      moveLayerUp: {
        text: "Move layer up",
        // Not actually used...
        disabled: this.props.isFirstLayer,
        handler: () => this.moveLayer(-1)
      },
      moveLayerDown: {
        text: "Move layer down",
        // Not actually used...
        disabled: this.props.isLastLayer,
        handler: () => this.moveLayer(+1)
      }
    }

    function handleSelection(id, event) {
      event.stopPropagation;
      items[id].handler();
    }

    return <div className="maputnik-layer-editor"
      >
      <header>
        <div className="layer-header">
          <h2 className="layer-header__title">
            Layer: {this.props.layer.id}
          </h2>
          <div className="layer-header__info">
            <Wrapper
              className='more-menu'
              onSelection={handleSelection}
              closeOnSelection={false}
            >
              <Button className='more-menu__button'>
                <MoreVertIcon className="more-menu__button__svg" />
              </Button>
              <Menu>
                <ul className="more-menu__menu">
                  {Object.keys(items).map((id, idx) => {
                    const item = items[id];
                    return <li key={id}>
                      <MenuItem value={id} className='more-menu__menu__item'>
                        {item.text}
                      </MenuItem>
                    </li>
                  })}
                </ul>
              </Menu>
            </Wrapper>
          </div>
        </div>

      </header>
      {groups}
    </div>
  }
}
