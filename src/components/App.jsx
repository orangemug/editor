import autoBind from 'react-autobind';
import React from 'react'
import cloneDeep from 'lodash.clonedeep'
import clamp from 'lodash.clamp'
import get from 'lodash.get'
import {unset} from 'lodash'
import arrayMove from 'array-move'

import LayerList from './LayerList'
import LayerEditor from './LayerEditor'
import AppLayout from './AppLayout'
import MessagePanel from './AppMessagePanel'
import MapGeneric from './MapGeneric'

import ModalSettings from './ModalSettings'
import ModalExport from './ModalExport'
import ModalSources from './ModalSources'
import ModalOpen from './ModalOpen'
import ModalShortcuts from './ModalShortcuts'
import ModalSurvey from './ModalSurvey'
import ModalDebug from './ModalDebug'

import {downloadGlyphsMetadata, downloadSpriteMetadata} from '../libs/metadata'
import {latest, validate} from '@mapbox/mapbox-gl-style-spec'
import style from '../libs/style'
import spec from '../libs/spec'
import {undoMessages, redoMessages} from '../libs/diffmessage'
import LayerWatcher from '../libs/layerwatcher'
import isEqual from 'lodash.isequal'
import {formatLayerId} from '../util/format';
import svgAccesibilityFilters from '../img/accesibility.svg';


export default class App extends React.Component {
  constructor(props) {
    super(props)
    autoBind(this);

    this.state = {
      errors: [],
      infos: [],
      sources: {},
      vectorLayers: {},
      spec: latest,
      mapView: {
        zoom: 0,
        center: {
          lng: 0,
          lat: 0,
        },
      },
    }

    this.layerWatcher = new LayerWatcher({
      onVectorLayersChange: v => this.setState({ vectorLayers: v })
    })
  }


  componentDidMount() {
    this.fetchSources();
  }

  updateFonts(urlTemplate) {
    const {mapStyle, uiState} = this.props;
    const metadata = mapStyle.metadata || {}
    const accessToken = metadata['maputnik:openmaptiles_access_token'] || uiState.tokens.openmaptiles

    let glyphUrl = (typeof urlTemplate === 'string')? urlTemplate.replace('{key}', accessToken): urlTemplate;
    downloadGlyphsMetadata(glyphUrl, fonts => {
      this.setState({
        spec: spec.updateRoot(this.state.spec, 'glyphs', fonts),
      })
    })
  }

  updateIcons(baseUrl) {
    downloadSpriteMetadata(baseUrl, icons => {
      this.setState({
        spec: spec.updateRoot(this.state.spec, 'sprite', icons),
      })
    })
  }

  onChangeMetadataProperty = (property, value) => {
    const {mapStyle} = this.props;
    // If we're changing renderer reset the map state.
    if (
      property === 'maputnik:renderer' &&
      value !== get(mapStyle, ['metadata', 'maputnik:renderer'], 'mbgljs')
    ) {
      this.props.onUiStateChanged({
        ...this.props.uiState,
        mapState: 'map',
      });
    }

    const changedStyle = {
      ...mapStyle,
      metadata: {
        ...mapStyle.metadata,
        [property]: value
      }
    }
    this.onStyleChanged(changedStyle)
  }

  onStyleChanged = (newStyle, opts={}) => {
    opts = {
      save: true,
      addRevision: true,
      initialLoad: false,
      ...opts,
    };

    const errors = validate(newStyle, latest) || [];

    // The validate function doesn't give us errors for duplicate error with
    // empty string for layer.id, manually deal with that here.
    const layerErrors = [];
    if (newStyle && newStyle.layers) {
      const foundLayers = new Map();
      newStyle.layers.forEach((layer, index) => {
        if (layer.id === "" && foundLayers.has(layer.id)) {
          const message = `Duplicate layer: ${formatLayerId(layer.id)}`;
          const error = new Error(
            `layers[${index}]: duplicate layer id [empty_string], previously used`
          );
          layerErrors.push(error);
        }
        foundLayers.set(layer.id, true);
      });
    }

    const mappedErrors = layerErrors.concat(errors).map(error => {
      // Special case: Duplicate layer id
      const dupMatch = error.message.match(/layers\[(\d+)\]: (duplicate layer id "?(.*)"?, previously used)/);
      if (dupMatch) {
        const [matchStr, index, message] = dupMatch;
        return {
          message: error.message,
          parsed: {
            type: "layer",
            data: {
              index: parseInt(index, 10),
              key: "id",
              message,
            }
          }
        }
      }

      // Special case: Invalid source
      const invalidSourceMatch = error.message.match(/layers\[(\d+)\]: (source "(?:.*)" not found)/);
      if (invalidSourceMatch) {
        const [matchStr, index, message] = invalidSourceMatch;
        return {
          message: error.message,
          parsed: {
            type: "layer",
            data: {
              index: parseInt(index, 10),
              key: "source",
              message,
            }
          }
        }
      }

      const layerMatch = error.message.match(/layers\[(\d+)\]\.(?:(\S+)\.)?(\S+): (.*)/);
      if (layerMatch) {
        const [matchStr, index, group, property, message] = layerMatch;
        const key = (group && property) ? [group, property].join(".") : property;
        return {
          message: error.message,
          parsed: {
            type: "layer",
            data: {
              index: parseInt(index, 10),
              key,
              message
            }
          }
        }
      }
      else {
        return {
          message: error.message,
        };
      }
    });

    let dirtyMapStyle = undefined;
    if (errors.length > 0) {
      dirtyMapStyle = cloneDeep(newStyle);

      errors.forEach(error => {
        const {message} = error;
        if (message) {
          try {
            const objPath = message.split(":")[0];
            // Errors can be deply nested for example 'layers[0].filter[1][1][0]' we only care upto the property 'layers[0].filter'
            const unsetPath = objPath.match(/^\S+?\[\d+\]\.[^\[]+/)[0];
            unset(dirtyMapStyle, unsetPath);
          }
          catch (err) {
            console.warn(err);
          }
        }
      });
    }

    const {mapStyle} = this.props;

    if(newStyle.glyphs !== mapStyle.glyphs) {
      this.updateFonts(newStyle.glyphs)
    }
    if(newStyle.sprite !== mapStyle.sprite) {
      this.updateIcons(newStyle.sprite)
    }

    this.setState({
      dirtyMapStyle: dirtyMapStyle,
      errors: mappedErrors,
    }, () => {
      this.props.onMapStyleChanged(newStyle);
      this.fetchSources(newStyle);
    });

  }

  fetchSources(mapStyle) {
    const {uiState} = this.props;
    if (!mapStyle) {
      mapStyle = this.props.mapStyle;
    }
    const sourceList = {};

    for(let [key, val] of Object.entries(mapStyle.sources)) {
      if(
        !this.state.sources.hasOwnProperty(key) &&
        val.type === "vector" &&
        val.hasOwnProperty("url")
      ) {
        sourceList[key] = {
          type: val.type,
          layers: []
        };

        let url = val.url;
        try {
          url = style.normalizeSourceURL(url, uiState.tokens);
        } catch(err) {
          console.warn("Failed to style.normalizeSourceURL: ", err);
        }

        try {
          url = style.replaceAccessToken(url, mapStyle, uiState)
        } catch(err) {
          console.warn("Failed to style.replaceAccessToken: ", err);
        }

        fetch(url, {
          mode: 'cors',
        })
        .then(response => response.json())
        .then(json => {

          if(!json.hasOwnProperty("vector_layers")) {
            return;
          }

          // Create new objects before setState
          const sources = Object.assign({}, {
            [key]: this.state.sources[key],
          });

          for(let layer of json.vector_layers) {
            sources[key].layers.push(layer.id)
          }

          console.debug("Updating source: "+key);
          this.setState({
            sources: sources
          });
        })
        .catch(err => {
          console.error("Failed to process sources for '%s'", url, err);
        });
      }
      else {
        sourceList[key] = this.state.sources[key] || mapStyle.sources[key];
      }
    }

    if(!isEqual(this.state.sources, sourceList)) {
      console.debug("Setting sources");
      this.setState({
        sources: sourceList
      })
    }
  }

  getRenderer () {
    const {mapStyle, uiState} = this.props;
    const metadata = mapStyle.metadata || {};
    const renderer = metadata['maputnik:renderer'] || 'mbgljs';

    // Check if this renderer is available
    if (uiState.renderers.includes(renderer)) {
      return renderer
    }
    else {
      return uiState.renderers[0];
    }
  }

  onChangeMapView = (mapView) => {
    this.setState({
      mapView,
    });
  }

  onMoveLayer = (move) => {
    const {mapStyle, uiState} = this.props;
    let { oldIndex, newIndex } = move;
    let layers = mapStyle.layers;
    oldIndex = clamp(oldIndex, 0, layers.length-1);
    newIndex = clamp(newIndex, 0, layers.length-1);
    if(oldIndex === newIndex) return;

    if (oldIndex === uiState.selectedLayerIndex) {
      this.props.onUiStateChanged({
        ...uiState,
        selectedLayerIndex: newIndex,
      });
    }

    layers = layers.slice(0);
    layers = arrayMove(layers, oldIndex, newIndex);
    this.onLayersChange(layers);
  }

  onLayersChange = (changedLayers) => {
    const {mapStyle} = this.props;
    const changedStyle = {
      ...mapStyle,
      layers: changedLayers
    }
    this.onStyleChanged(changedStyle)
  }

  onLayerDestroy = (index) => {
    const {mapStyle} = this.props;
    let layers = mapStyle.layers;
    const remainingLayers = layers.slice(0);
    remainingLayers.splice(index, 1);
    this.onLayersChange(remainingLayers);
  }

  onLayerCopy = (index) => {
    const {mapStyle} = this.props;
    let layers = mapStyle.layers;
    const changedLayers = layers.slice(0)

    const clonedLayer = cloneDeep(changedLayers[index])
    clonedLayer.id = clonedLayer.id + "-copy"
    changedLayers.splice(index, 0, clonedLayer)
    this.onLayersChange(changedLayers)
  }

  onLayerVisibilityToggle = (index) => {
    const {mapStyle} = this.props;
    let layers = mapStyle.layers;
    const changedLayers = layers.slice(0)

    const layer = { ...changedLayers[index] }
    const changedLayout = 'layout' in layer ? {...layer.layout} : {}
    changedLayout.visibility = changedLayout.visibility === 'none' ? 'visible' : 'none'

    layer.layout = changedLayout
    changedLayers[index] = layer
    this.onLayersChange(changedLayers)
  }

  onLayerIdChange = (index, oldId, newId) => {
    const {mapStyle} = this.props;
    const changedLayers = mapStyle.layers.slice(0)
    changedLayers[index] = {
      ...changedLayers[index],
      id: newId
    }

    this.onLayersChange(changedLayers)
  }

  onLayerChanged = (index, layer) => {
    const {mapStyle} = this.props;
    const changedLayers = mapStyle.layers.slice(0)
    changedLayers[index] = layer

    this.onLayersChange(changedLayers)
  }

  setMapState = (newState) => {
    this.props.onUiStateChanged({
      ...this.props.uiState,
      mapState: newState,
    });
  }

  openStyle = (styleObj) => {
    styleObj = style.setDefaults(styleObj);
    this.onStyleChanged(styleObj);
  }

  onLayerSelect = (index) => {
    this.props.onUiStateChanged({
      ...this.props.uiState,
      selectedLayerIndex: index,
    });
  }

  setModal(modalName, value) {
    if(modalName === 'survey' && value === false) {
      localStorage.setItem('survey', '');
    }

    this.props.onUiStateChanged({
      ...this.props.uiState,
      isOpen: {
        ...this.props.uiState.isOpen,
        [modalName]: value
      }
    })
  }

  toggleModal(modalName) {
    this.setModal(modalName, !this.props.uiState.isOpen[modalName]);
  }

  onChangeOpenlayersDebug = (key, value) => {
    this.props.onUiStateChanged({
      ...this.props.uiState,
      openlayersOptions: {
        ...this.props.uiState.openlayersOptions,
        [key]: value,
      }
    });
  }

  onChangeMaboxGlDebug = (key, value) => {
    this.props.onUiStateChanged({
      ...this.props.uiState,
      mapboxGlOptions: {
        ...this.props.uiState.mapboxGlOptions,
        [key]: value,
      }
    });
  }

  render() {
    const {mapStyle, uiState} = this.props;
    const {isOpen} = uiState;
    const layers = mapStyle.layers || [];
    const selectedLayer = layers.length > 0 ? layers[uiState.selectedLayerIndex] : null
    const metadata = mapStyle.metadata || {}

    const layerList = <LayerList
      onMoveLayer={this.onMoveLayer}
      onLayerDestroy={this.onLayerDestroy}
      onLayerCopy={this.onLayerCopy}
      onLayerVisibilityToggle={this.onLayerVisibilityToggle}
      onLayersChange={this.onLayersChange}
      onLayerSelect={this.onLayerSelect}
      selectedLayerIndex={uiState.selectedLayerIndex}
      layers={layers}
      sources={this.state.sources}
      errors={this.state.errors}
      layerTypes={uiState.layerTypes}
    />

    const layerEditor = selectedLayer ? <LayerEditor
      key={selectedLayer.id}
      layer={selectedLayer}
      layerIndex={uiState.selectedLayerIndex}
      isFirstLayer={uiState.selectedLayerIndex < 1}
      isLastLayer={uiState.selectedLayerIndex === mapStyle.layers.length-1}
      sources={this.state.sources}
      vectorLayers={this.state.vectorLayers}
      spec={this.state.spec}
      onMoveLayer={this.onMoveLayer}
      onLayerChanged={this.onLayerChanged}
      onLayerDestroy={this.onLayerDestroy}
      onLayerCopy={this.onLayerCopy}
      onLayerVisibilityToggle={this.onLayerVisibilityToggle}
      onLayerIdChange={this.onLayerIdChange}
      errors={this.state.errors}
      layerTypes={uiState.layerTypes}
    /> : null

    const bottomPanel = (this.state.errors.length + this.state.infos.length) > 0 ? <MessagePanel
      currentLayer={selectedLayer}
      selectedLayerIndex={uiState.selectedLayerIndex}
      onLayerSelect={this.onLayerSelect}
      mapStyle={mapStyle}
      errors={this.state.errors}
      infos={this.state.infos}
    /> : null


    const modals = <div>
      <ModalDebug
        renderer={this.getRenderer()}
        mapboxGlOptions={uiState.mapboxGlOptions}
        openlayersOptions={uiState.openlayersOptions}
        onChangeMaboxGlDebug={this.onChangeMaboxGlDebug}
        onChangeOpenlayersDebug={this.onChangeOpenlayersDebug}
        isOpen={isOpen.debug}
        onOpenToggle={this.toggleModal.bind(this, 'debug')}
        mapView={this.state.mapView}
      />
      <ModalShortcuts
        ref={(el) => this.shortcutEl = el}
        isOpen={isOpen.shortcuts}
        onOpenToggle={this.toggleModal.bind(this, 'shortcuts')}
      />
      <ModalSettings
        mapStyle={mapStyle}
        availableRenderers={uiState.renderers}
        onStyleChanged={this.onStyleChanged}
        onChangeMetadataProperty={this.onChangeMetadataProperty}
        isOpen={isOpen.settings}
        onOpenToggle={this.toggleModal.bind(this, 'settings')}
        openlayersOptions={uiState.openlayersOptions}
      />
      <ModalExport
        mapStyle={mapStyle}
        tokens={uiState.tokens}
        onStyleChanged={this.onStyleChanged}
        isOpen={isOpen.export}
        onOpenToggle={this.toggleModal.bind(this, 'export')}
      />
      <ModalOpen
        isOpen={isOpen.open}
        onStyleOpen={this.openStyle}
        onOpenToggle={this.toggleModal.bind(this, 'open')}
      />
      <ModalSources
        mapStyle={mapStyle}
        onStyleChanged={this.onStyleChanged}
        isOpen={isOpen.sources}
        onOpenToggle={this.toggleModal.bind(this, 'sources')}
        publicSources={uiState.publicSources}
      />
      <ModalSurvey
        isOpen={isOpen.survey}
        onOpenToggle={this.toggleModal.bind(this, 'survey')}
      />
    </div>

    const map = <MapGeneric
      mapStyle={mapStyle}
      tokens={uiState.tokens}
      dirtyMapStyle={this.state.dirtyMapStyle}
      transformRequest={this.props.transformRequest}
      renderer={this.getRenderer()}
      mapState={uiState.mapState}
      mapboxGlOptions={uiState.mapboxGlOptions}
      openlayersOptions={uiState.openlayersOptions}
      selectedLayerIndex={uiState.selectedLayerIndex}
      onChangeMapView={this.onChangeMapView}
      onLayerSelect={this.onLayerSelect}
      onDataChange={e => {
        this.layerWatcher.analyzeMap(e.map)
        this.fetchSources();
      }}
    />

    return <div className="maputnik maputnik-root">
      <div dangerouslySetInnerHTML={{__html: svgAccesibilityFilters}} />
      <AppLayout
        layerList={layerList}
        layerEditor={layerEditor}
        map={map}
        bottom={bottomPanel}
        modals={modals}
      />
    </div>
  }
}
