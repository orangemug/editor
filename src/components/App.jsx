import autoBind from 'react-autobind';
import React from 'react'
import cloneDeep from 'lodash.clonedeep'
import clamp from 'lodash.clamp'
import get from 'lodash.get'
import {unset} from 'lodash'
import arrayMove from 'array-move'
import url from 'url'
import hash from "string-hash";

import MapMapboxGl from './MapMapboxGl'
import MapOpenLayers from './MapOpenLayers'
import LayerList from './LayerList'
import LayerEditor from './LayerEditor'
import AppToolbar from './AppToolbar'
import AppLayout from './AppLayout'
import MessagePanel from './AppMessagePanel'

import ModalSettings from './ModalSettings'
import ModalExport from './ModalExport'
import ModalSources from './ModalSources'
import ModalOpen from './ModalOpen'
import ModalShortcuts from './ModalShortcuts'
import ModalSurvey from './ModalSurvey'
import ModalDebug from './ModalDebug'

import { downloadGlyphsMetadata, downloadSpriteMetadata } from '../libs/metadata'
import {latest, validate} from '@mapbox/mapbox-gl-style-spec'
import style from '../libs/style'
import { initialStyleUrl, loadStyleUrl, removeStyleQuerystring } from '../libs/urlopen'
import { undoMessages, redoMessages } from '../libs/diffmessage'
import { StyleStore } from '../libs/stylestore'
import { ApiStyleStore } from '../libs/apistore'
import { RevisionStore } from '../libs/revisions'
import LayerWatcher from '../libs/layerwatcher'
import tokens from '../config/tokens.json'
import isEqual from 'lodash.isequal'
import Debug from '../libs/debug'
import queryUtil from '../libs/query-util'
import {formatLayerId} from '../util/format';

import MapboxGl from 'mapbox-gl'


// Similar functionality as <https://github.com/mapbox/mapbox-gl-js/blob/7e30aadf5177486c2cfa14fe1790c60e217b5e56/src/util/mapbox.js>
function normalizeSourceURL (url, apiToken="") {
  const matches = url.match(/^mapbox:\/\/(.*)/);
  if (matches) {
    // mapbox://mapbox.mapbox-streets-v7
    return `https://api.mapbox.com/v4/${matches[1]}.json?secure&access_token=${apiToken}`
  }
  else {
    return url;
  }
}

function setFetchAccessToken(url, mapStyle) {
  const matchesTilehosting = url.match(/\.tilehosting\.com/);
  const matchesMaptiler = url.match(/\.maptiler\.com/);
  const matchesThunderforest = url.match(/\.thunderforest\.com/);
  if (matchesTilehosting || matchesMaptiler) {
    const accessToken = style.getAccessToken("openmaptiles", mapStyle, {allowFallback: true})
    if (accessToken) {
      return url.replace('{key}', accessToken)
    }
  }
  else if (matchesThunderforest) {
    const accessToken = style.getAccessToken("thunderforest", mapStyle, {allowFallback: true})
    if (accessToken) {
      return url.replace('{key}', accessToken)
    }
  }
  else {
    return url;
  }
}

function updateRootSpec(spec, fieldName, newValues) {
  return {
    ...spec,
    $root: {
      ...spec.$root,
      [fieldName]: {
        ...spec.$root[fieldName],
        values: newValues
      }
    }
  }
}

export default class App extends React.Component {
  constructor(props) {
    super(props)
    autoBind(this);

    this.revisionStore = new RevisionStore()
    const params = new URLSearchParams(window.location.search.substring(1))
    let port = params.get("localport")
    if (port == null && (window.location.port != 80 && window.location.port != 443)) {
      port = window.location.port
    }
    this.styleStore = new ApiStyleStore({
      onLocalStyleChange: mapStyle => this.onStyleChanged(mapStyle, {save: false}),
      port: port,
      host: params.get("localhost")
    })

    // const styleUrl = initialStyleUrl()
    // if(styleUrl && window.confirm("Load style from URL: " + styleUrl + " and discard current changes?")) {
    //   this.styleStore = new StyleStore()
    //   loadStyleUrl(styleUrl, mapStyle => this.onStyleChanged(mapStyle))
    //   removeStyleQuerystring()
    // } else {
    //   if(styleUrl) {
    //     removeStyleQuerystring()
    //   }
    //   this.styleStore.init(err => {
    //     if(err) {
    //       console.log('Falling back to local storage for storing styles')
    //       this.styleStore = new StyleStore()
    //     }
    //     this.styleStore.latestStyle(mapStyle => this.onStyleChanged(mapStyle, {initialLoad: true}))

    //     if(Debug.enabled()) {
    //       Debug.set("maputnik", "styleStore", this.styleStore);
    //       Debug.set("maputnik", "revisionStore", this.revisionStore);
    //     }
    //   })
    // }

    if(Debug.enabled()) {
      Debug.set("maputnik", "revisionStore", this.revisionStore);
      Debug.set("maputnik", "styleStore", this.styleStore);
    }

    const queryObj = url.parse(window.location.href, true).query;

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

  // handleKeyPress = (e) => {
  //   if(navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
  //     if(e.metaKey && e.shiftKey && e.keyCode === 90) {
  //       e.preventDefault();
  //       this.onRedo(e);
  //     }
  //     else if(e.metaKey && e.keyCode === 90) {
  //       e.preventDefault();
  //       this.onUndo(e);
  //     }
  //   }
  //   else {
  //     if(e.ctrlKey && e.keyCode === 90) {
  //       e.preventDefault();
  //       this.onUndo(e);
  //     }
  //     else if(e.ctrlKey && e.keyCode === 89) {
  //       e.preventDefault();
  //       this.onRedo(e);
  //     }
  //   }
  // }

  // componentDidMount() {
  //   window.addEventListener("keydown", this.handleKeyPress);
  // }

  // componentWillUnmount() {
  //   window.removeEventListener("keydown", this.handleKeyPress);
  // }

  saveStyle(snapshotStyle) {
    this.styleStore.save(snapshotStyle)
  }

  updateFonts(urlTemplate) {
    const mapStyle = this.props.style;
    const metadata = mapStyle.metadata || {}
    const accessToken = metadata['maputnik:openmaptiles_access_token'] || tokens.openmaptiles

    let glyphUrl = (typeof urlTemplate === 'string')? urlTemplate.replace('{key}', accessToken): urlTemplate;
    downloadGlyphsMetadata(glyphUrl, fonts => {
      this.setState({ spec: updateRootSpec(this.state.spec, 'glyphs', fonts)})
    })
  }

  updateIcons(baseUrl) {
    downloadSpriteMetadata(baseUrl, icons => {
      this.setState({ spec: updateRootSpec(this.state.spec, 'sprite', icons)})
    })
  }

  onChangeMetadataProperty = (property, value) => {
    const mapStyle = this.props.style;
    // If we're changing renderer reset the map state.
    if (
      property === 'maputnik:renderer' &&
      value !== get(mapStyle, ['metadata', 'maputnik:renderer'], 'mbgljs')
    ) {
      this.onUiStateChanged({
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

    const mapStyle = this.props.style;

    if(newStyle.glyphs !== mapStyle.glyphs) {
      this.updateFonts(newStyle.glyphs)
    }
    if(newStyle.sprite !== mapStyle.sprite) {
      this.updateIcons(newStyle.sprite)
    }

    if (opts.addRevision) {
      this.revisionStore.addRevision(newStyle);
    }
    if (opts.save) {
      this.saveStyle(newStyle);
    }
       
    this.setState({
      dirtyMapStyle: dirtyMapStyle,
      errors: mappedErrors,
    }, () => {
      this.props.onStyleChanged(newStyle);
      this.fetchSources();
    });

  }

  // onUndo = () => {
  //   const activeStyle = this.revisionStore.undo()

  //   const messages = undoMessages(this.state.mapStyle, activeStyle)
  //   this.onStyleChanged(activeStyle, {addRevision: false});
  //   this.setState({
  //     infos: messages,
  //   })
  // }

  // onRedo = () => {
  //   const activeStyle = this.revisionStore.redo()
  //   const messages = redoMessages(this.state.mapStyle, activeStyle)
  //   this.onStyleChanged(activeStyle, {addRevision: false});
  //   this.setState({
  //     infos: messages,
  //   })
  // }

  onMoveLayer = (move) => {
    const mapStyle = this.props.style;
    let { oldIndex, newIndex } = move;
    let layers = mapStyle.layers;
    oldIndex = clamp(oldIndex, 0, layers.length-1);
    newIndex = clamp(newIndex, 0, layers.length-1);
    if(oldIndex === newIndex) return;

    if (oldIndex === this.props.uiState.selectedLayerIndex) {
      this.props.onUiStateChanged({
        ...this.props.uiState,
        selectedLayerIndex: newIndex,
      });
    }

    layers = layers.slice(0);
    layers = arrayMove(layers, oldIndex, newIndex);
    this.onLayersChange(layers);
  }

  onLayersChange = (changedLayers) => {
    const mapStyle = this.props.style;
    const changedStyle = {
      ...mapStyle,
      layers: changedLayers
    }
    this.onStyleChanged(changedStyle)
  }

  onLayerDestroy = (index) => {
    const mapStyle = this.props.style;
    let layers = mapStyle.layers;
    const remainingLayers = layers.slice(0);
    remainingLayers.splice(index, 1);
    this.onLayersChange(remainingLayers);
  }

  onLayerCopy = (index) => {
    const mapStyle = this.props.style;
    let layers = mapStyle.layers;
    const changedLayers = layers.slice(0)

    const clonedLayer = cloneDeep(changedLayers[index])
    clonedLayer.id = clonedLayer.id + "-copy"
    changedLayers.splice(index, 0, clonedLayer)
    this.onLayersChange(changedLayers)
  }

  onLayerVisibilityToggle = (index) => {
    const mapStyle = this.props.style;
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
    const mapStyle = this.props.style;
    const changedLayers = mapStyle.layers.slice(0)
    changedLayers[index] = {
      ...changedLayers[index],
      id: newId
    }

    this.onLayersChange(changedLayers)
  }

  onLayerChanged = (index, layer) => {
    const mapStyle = this.props.style;
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

  setDefaultValues = (styleObj) => {
    const metadata = styleObj.metadata || {}
    if(metadata['maputnik:renderer'] === undefined) {
      const changedStyle = {
        ...styleObj,
        metadata: {
          ...styleObj.metadata,
          'maputnik:renderer': 'mbgljs'
        }
      }
      return changedStyle
    } else {
      return styleObj
    }
  }

  openStyle = (styleObj) => {
    styleObj = this.setDefaultValues(styleObj)
    this.onStyleChanged(styleObj)
  }

  fetchSources() {
    const mapStyle = this.props.style;
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
          url = normalizeSourceURL(url, MapboxGl.accessToken);
        } catch(err) {
          console.warn("Failed to normalizeSourceURL: ", err);
        }

        try {
          url = setFetchAccessToken(url, mapStyle)
        } catch(err) {
          console.warn("Failed to setFetchAccessToken: ", err);
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

  _getRenderer () {
    const mapStyle = this.props.style;
    const metadata = mapStyle.metadata || {};
    return metadata['maputnik:renderer'] || 'mbgljs';
  }

  onMapChange = (mapView) => {
    this.setState({
      mapView,
    });
  }

  mapRenderer() {
    const mapStyle = this.props.style;
    const {dirtyMapStyle} = this.state;
    const metadata = mapStyle.metadata || {};

    const mapProps = {
      mapStyle: (dirtyMapStyle || mapStyle),
      replaceAccessTokens: (mapStyle) => {
        return style.replaceAccessTokens(mapStyle, {
          allowFallback: true
        });
      },
      onDataChange: (e) => {
        this.layerWatcher.analyzeMap(e.map)
        this.fetchSources();
      },
    }

    const renderer = this._getRenderer();

    let mapElement;
    const {
      mapState,
      mapboxGlDebugOptions,
      openlayersDebugOptions,
      selectedLayerIndex
    } = this.props.uiState;


    // Check if OL code has been loaded?
    if(renderer === 'ol') {
      mapElement = <MapOpenLayers
        {...mapProps}
        onChange={this.onMapChange}
        debugToolbox={openlayersDebugOptions.debugToolbox}
        onLayerSelect={this.onLayerSelect}
      />
    } else {
      mapElement = <MapMapboxGl {...mapProps}
        onChange={this.onMapChange}
        options={mapboxGlDebugOptions}
        inspectModeEnabled={mapState === "inspect"}
        highlightedLayer={mapStyle.layers[selectedLayerIndex]}
        onLayerSelect={this.onLayerSelect} />
    }

    let filterName;
    if(mapState.match(/^filter-/)) {
      filterName = mapState.replace(/^filter-/, "");
    }
    const elementStyle = {};
    if (filterName) {
      elementStyle.filter = `url('#${filterName}')`;
    };

    return <div style={elementStyle} className="maputnik-map__container">
      {mapElement}
    </div>
  }

  // DONE
  onLayerSelect = (index) => {
    this.props.onUiStateChanged({
      ...this.props.uiState,
      selectedLayerIndex: index,
    });
  }

  // DONE
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

  // DONE
  toggleModal(modalName) {
    this.setModal(modalName, !this.props.uiState.isOpen[modalName]);
  }

  // DONE
  onChangeOpenlayersDebug = (key, value) => {
    this.props.onUiStateChanged({
      ...this.props.uiState,
      openlayersDebugOptions: {
        ...this.props.uiState.openlayersDebugOptions,
        [key]: value,
      }
    });
  }

  // DONE
  onChangeMaboxGlDebug = (key, value) => {
    this.props.onUiStateChanged({
      ...this.props.uiState,
      mapboxGlDebugOptions: {
        ...this.props.uiState.mapboxGlDebugOptions,
        [key]: value,
      }
    });
  }

  render() {
    const mapStyle = this.props.style;
    const {isOpen} = this.props.uiState;
    const layers = mapStyle.layers || [];
    const selectedLayer = layers.length > 0 ? layers[this.props.uiState.selectedLayerIndex] : null
    const metadata = mapStyle.metadata || {}

    const layerList = <LayerList
      onMoveLayer={this.onMoveLayer}
      onLayerDestroy={this.onLayerDestroy}
      onLayerCopy={this.onLayerCopy}
      onLayerVisibilityToggle={this.onLayerVisibilityToggle}
      onLayersChange={this.onLayersChange}
      onLayerSelect={this.onLayerSelect}
      selectedLayerIndex={this.props.uiState.selectedLayerIndex}
      layers={layers}
      sources={this.state.sources}
      errors={this.state.errors}
    />

    const layerEditor = selectedLayer ? <LayerEditor
      key={selectedLayer.id}
      layer={selectedLayer}
      layerIndex={this.props.uiState.selectedLayerIndex}
      isFirstLayer={this.props.uiState.selectedLayerIndex < 1}
      isLastLayer={this.props.uiState.selectedLayerIndex === mapStyle.layers.length-1}
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
    /> : null

    const bottomPanel = (this.state.errors.length + this.state.infos.length) > 0 ? <MessagePanel
      currentLayer={selectedLayer}
      selectedLayerIndex={this.props.uiState.selectedLayerIndex}
      onLayerSelect={this.onLayerSelect}
      mapStyle={mapStyle}
      errors={this.state.errors}
      infos={this.state.infos}
    /> : null


    const modals = <div>
      <ModalDebug
        renderer={this._getRenderer()}
        mapboxGlDebugOptions={this.props.uiState.mapboxGlDebugOptions}
        openlayersDebugOptions={this.props.uiState.openlayersDebugOptions}
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
        onStyleChanged={this.onStyleChanged}
        onChangeMetadataProperty={this.onChangeMetadataProperty}
        isOpen={isOpen.settings}
        onOpenToggle={this.toggleModal.bind(this, 'settings')}
        openlayersDebugOptions={this.state.openlayersDebugOptions}
      />
      <ModalExport
        mapStyle={mapStyle}
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
      />
      <ModalSurvey
        isOpen={isOpen.survey}
        onOpenToggle={this.toggleModal.bind(this, 'survey')}
      />
    </div>

    return <AppLayout
      layerList={layerList}
      layerEditor={layerEditor}
      map={this.mapRenderer()}
      bottom={bottomPanel}
      modals={modals}
    />
  }
}
