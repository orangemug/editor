import React from 'react'
import Mousetrap from 'mousetrap'

import MapboxGlMap from './map/MapboxGlMap'
import OpenLayers3Map from './map/OpenLayers3Map'
import LayerList from './layers/LayerList'
import LayerEditor from './layers/LayerEditor'
import Toolbar from './Toolbar'
import AppLayout from './AppLayout'
import MessagePanel from './MessagePanel'

import { downloadGlyphsMetadata, downloadSpriteMetadata } from '../libs/metadata'
import styleSpec from '@mapbox/mapbox-gl-style-spec/style-spec'
import style from '../libs/style.js'
import { initialStyleUrl, loadStyleUrl } from '../libs/urlopen'
import { undoMessages, redoMessages } from '../libs/diffmessage'
import { loadDefaultStyle, StyleStore } from '../libs/stylestore'
import { ApiStyleStore } from '../libs/apistore'
import { RevisionStore } from '../libs/revisions'
import LayerWatcher from '../libs/layerwatcher'
import tokens from '../config/tokens.json'
import isEqual from 'lodash.isequal'

import MapboxGl from 'mapbox-gl'
import mapboxUtil from 'mapbox-gl/src/util/mapbox'


function NaNOrZero(v) {
  v = Number(v);
  if(Number.isNaN(v)) {
    return 0;
  }
  else {
    return v;
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
    this.revisionStore = new RevisionStore()
    this.styleStore = new ApiStyleStore({
      onLocalStyleChange: mapStyle => this.onStyleChanged(mapStyle, false)
    })

    this._onHashChange = this._onHashChange.bind(this);
    this._onHashChange();

    const styleUrl = initialStyleUrl()
    if(styleUrl) {
      this.styleStore = new StyleStore()
      loadStyleUrl(styleUrl, mapStyle => this.onStyleChanged(mapStyle))
    } else {
      this.styleStore.init(err => {
        if(err) {
          console.log('Falling back to local storage for storing styles')
          this.styleStore = new StyleStore()
        }
        this.styleStore.latestStyle(mapStyle => this.onStyleChanged(mapStyle))
      })
    }

    const initialPosition = this._getHashState();

    this.state = {
      ...initialPosition,
      errors: [],
      infos: [],
      mapStyle: style.emptyStyle,
      selectedLayerIndex: 0,
      sources: {},
      vectorLayers: {},
      inspectModeEnabled: false,
      spec: styleSpec.latest,
    }

    this.layerWatcher = new LayerWatcher({
      onVectorLayersChange: v => this.setState({ vectorLayers: v })
    })
  }

  componentDidMount() {
    window.addEventListener('hashchange', this._onHashChange);
    this.fetchSources();
    Mousetrap.bind(['ctrl+z'], this.onUndo.bind(this));
    Mousetrap.bind(['ctrl+y'], this.onRedo.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this._onHashChange);
    Mousetrap.unbind(['ctrl+z'], this.onUndo.bind(this));
    Mousetrap.unbind(['ctrl+y'], this.onRedo.bind(this));
  }

  onReset() {
    this.styleStore.purge()
    loadDefaultStyle(mapStyle => this.onStyleOpen(mapStyle))
  }

  saveStyle(snapshotStyle) {
    this.styleStore.save(snapshotStyle)
  }

  updateFonts(urlTemplate) {
    const metadata = this.state.mapStyle.metadata || {}
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

  onStyleChanged(newStyle, save=true) {

    const errors = styleSpec.validate(newStyle, styleSpec.latest)
    if(errors.length === 0) {

      if(newStyle.glyphs !== this.state.mapStyle.glyphs) {
        this.updateFonts(newStyle.glyphs)
      }
      if(newStyle.sprite !== this.state.mapStyle.sprite) {
        this.updateIcons(newStyle.sprite)
      }

      this.revisionStore.addRevision(newStyle)
      if(save) this.saveStyle(newStyle)
      this.setState({
        mapStyle: newStyle,
        errors: [],
      })
    } else {
      this.setState({
        errors: errors.map(err => err.message)
      })
    }

    this.fetchSources();
  }

  onUndo() {
    const activeStyle = this.revisionStore.undo()
    const messages = undoMessages(this.state.mapStyle, activeStyle)
    this.saveStyle(activeStyle)
    this.setState({
      mapStyle: activeStyle,
      infos: messages,
    })
  }

  onRedo() {
    const activeStyle = this.revisionStore.redo()
    const messages = redoMessages(this.state.mapStyle, activeStyle)
    this.saveStyle(activeStyle)
    this.setState({
      mapStyle: activeStyle,
      infos: messages,
    })
  }

  onLayersChange(changedLayers) {
    const changedStyle = {
      ...this.state.mapStyle,
      layers: changedLayers
    }
    this.onStyleChanged(changedStyle)
  }

  onLayerIdChange(oldId, newId) {
    const changedLayers = this.state.mapStyle.layers.slice(0)
    const idx = style.indexOfLayer(changedLayers, oldId)

    changedLayers[idx] = {
      ...changedLayers[idx],
      id: newId
    }

    this.onLayersChange(changedLayers)
  }

  onLayerChanged(layer) {
    const changedLayers = this.state.mapStyle.layers.slice(0)
    const idx = style.indexOfLayer(changedLayers, layer.id)
    changedLayers[idx] = layer

    this.onLayersChange(changedLayers)
  }

  changeInspectMode() {
    this.setState({
      inspectModeEnabled: !this.state.inspectModeEnabled
    })
  }

  fetchSources() {
    const sourceList = {...this.state.sources};

    for(let [key, val] of Object.entries(this.state.mapStyle.sources)) {
      if(sourceList.hasOwnProperty(key)) {
        continue;
      }

      sourceList[key] = {
        type: val.type,
        layers: []
      };

      if(!this.state.sources.hasOwnProperty(key) && val.type === "vector" && val.hasOwnProperty("url")) {
        let url = val.url;
        try {
          url = mapboxUtil.normalizeSourceURL(url, MapboxGl.accessToken);
        } catch(err) {
          console.warn("Failed to normalizeSourceURL: ", err);
        }

        fetch(url)
          .then((response) => {
            return response.json();
          })
          .then((json) => {
            if(!json.hasOwnProperty("vector_layers")) {
              return;
            }

            // Create new objects before setState
            const sources = Object.assign({}, this.state.sources);

            for(let layer of json.vector_layers) {
              sources[key].layers.push(layer.id)
            }

            console.debug("Updating source: "+key);
            this.setState({
              sources: sources
            });
          })
          .catch((err) => {
            console.error("Failed to process sources for '%s'", url, err);
          })
      }
    }

    if(!isEqual(this.state.sources, sourceList)) {
      console.debug("Setting sources");
      this.setState({
        sources: sourceList
      })
    }
  }

  _onHashChange() {
    this.setState(this._getHashState())
  }

  _getHashState () {
    const [zoom, lat, lng] = window.location.hash.replace('#', '').split('/');
    return {
      zoom: NaNOrZero(zoom),
      lat: NaNOrZero(lat),
      lng: NaNOrZero(lng)
    }
  }

  mapRenderer() {
    const mapProps = {
      lat: this.state.lat,
      lng: this.state.lng,
      zoom: this.state.zoom,
      mapStyle: style.replaceAccessToken(this.state.mapStyle, {allowFallback: true}),
      onViewChange: (e) => {
        const d = {
          lat:  NaNOrZero(e.lat),
          lng:  NaNOrZero(e.lng),
          zoom: NaNOrZero(e.zoom),
        }

        // Adapted from <https://github.com/mapbox/mapbox-gl-js/blob/24373a4027e4531b1acfbb9bf99861aef6a31c71/src/ui/hash.js> to get a consistant zoom across renderers
        const zoom = Math.round(d.zoom * 100) / 100;

        // See <https://twitter.com/mourner/status/935958080529068038>
        const precision = Math.ceil((zoom * Math.LN2 + Math.log(512 / 360 / 0.5)) / Math.LN10);
        const m = Math.pow(10, precision);
        const lng = Math.round(d.lng * m) / m;
        const lat = Math.round(d.lat * m) / m;

        const hashStr = `#${zoom}/${lat}/${lng}`
        history.replaceState('', '', hashStr);
      },
      onDataChange: (e) => {
        this.layerWatcher.analyzeMap(e.map)
        this.fetchSources();
      },
    }

    const metadata = this.state.mapStyle.metadata || {}
    const renderer = metadata['maputnik:renderer'] || 'mbgljs'

    // Check if OL3 code has been loaded?
    if(renderer === 'ol3') {
      return <OpenLayers3Map {...mapProps} />
    } else {
      return  <MapboxGlMap {...mapProps}
        inspectModeEnabled={this.state.inspectModeEnabled}
        highlightedLayer={this.state.mapStyle.layers[this.state.selectedLayerIndex]}
        onLayerSelect={this.onLayerSelect.bind(this)} />
    }
  }

  onLayerSelect(layerId) {
    const idx = style.indexOfLayer(this.state.mapStyle.layers, layerId)
    this.setState({ selectedLayerIndex: idx })
  }

  render() {
    const layers = this.state.mapStyle.layers || []
    const selectedLayer = layers.length > 0 ? layers[this.state.selectedLayerIndex] : null
    const metadata = this.state.mapStyle.metadata || {}

    const toolbar = <Toolbar
      mapStyle={this.state.mapStyle}
      inspectModeEnabled={this.state.inspectModeEnabled}
      sources={this.state.sources}
      onStyleChanged={this.onStyleChanged.bind(this)}
      onStyleOpen={this.onStyleChanged.bind(this)}
      onInspectModeToggle={this.changeInspectMode.bind(this)}
    />

    const layerList = <LayerList
      onLayersChange={this.onLayersChange.bind(this)}
      onLayerSelect={this.onLayerSelect.bind(this)}
      selectedLayerIndex={this.state.selectedLayerIndex}
      layers={layers}
      sources={this.state.sources}
    />

    const layerEditor = selectedLayer ? <LayerEditor
      layer={selectedLayer}
      sources={this.state.sources}
      vectorLayers={this.state.vectorLayers}
      spec={this.state.spec}
      onLayerChanged={this.onLayerChanged.bind(this)}
      onLayerIdChange={this.onLayerIdChange.bind(this)}
    /> : null

    const bottomPanel = (this.state.errors.length + this.state.infos.length) > 0 ? <MessagePanel
      errors={this.state.errors}
      infos={this.state.infos}
    /> : null

    return <AppLayout
      toolbar={toolbar}
      layerList={layerList}
      layerEditor={layerEditor}
      map={this.mapRenderer()}
      bottom={bottomPanel}
    />
  }
}
