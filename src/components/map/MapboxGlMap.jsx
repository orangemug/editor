import React from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import MapboxGl from 'mapbox-gl'
import MapboxInspect from 'mapbox-gl-inspect'
import FeatureLayerPopup from './FeatureLayerPopup'
import FeaturePropertyPopup from './FeaturePropertyPopup'
import style from '../../libs/style.js'
import tokens from '../../config/tokens.json'
import colors from 'mapbox-gl-inspect/lib/colors'
import Color from 'color'
import ZoomControl from '../../libs/zoomcontrol'
import { colorHighlightedLayer } from '../../libs/highlight'
import 'mapbox-gl/dist/mapbox-gl.css'
import '../../mapboxgl.css'
import '../../libs/mapbox-rtl'

function renderPropertyPopup(features) {
  var mountNode = document.createElement('div');
  ReactDOM.render(<FeaturePropertyPopup features={features} />, mountNode)
  return mountNode.innerHTML;
}

function buildInspectStyle(originalMapStyle, coloredLayers, highlightedLayer) {
  const backgroundLayer = {
    "id": "background",
    "type": "background",
    "paint": {
      "background-color": '#1c1f24',
    }
  }

  const layer = colorHighlightedLayer(highlightedLayer)
  if(layer) {
    coloredLayers.push(layer)
  }

  const sources = {}
  Object.keys(originalMapStyle.sources).forEach(sourceId => {
    const source = originalMapStyle.sources[sourceId]
    if(source.type !== 'raster' && source.type !== 'raster-dem') {
      sources[sourceId] = source
    }
  })

  const inspectStyle = {
    ...originalMapStyle,
    sources: sources,
    layers: [backgroundLayer].concat(coloredLayers)
  }
  return inspectStyle
}

export default class MapboxGlMap extends React.Component {
  static propTypes = {
    onDataChange: PropTypes.func,
    onMove: PropTypes.func,
    onZoom: PropTypes.func,
    onPitch: PropTypes.func,
    onRotate: PropTypes.func,
    onMoveEnd: PropTypes.func,
    onZoomEnd: PropTypes.func,
    onPitchEnd: PropTypes.func,
    onRotateEnd: PropTypes.func,
    onLayerSelect: PropTypes.func.isRequired,
    mapStyle: PropTypes.object,
    inspectModeEnabled: PropTypes.bool,
    highlightedLayer: PropTypes.object,
    options: PropTypes.object,
  }

  static defaultProps = {
    mapStyle: null,
    inspectModeEnabled: false,
    onMapLoaded: () => {},
    onDataChange: () => {},
    onLayerSelect: () => {},
    onMove: () => {},
    onZoom: () => {},
    onPitch: () => {},
    onRotate: () => {},
    onMoveEnd: () => {},
    onZoomEnd: () => {},
    onPitchEnd: () => {},
    onRotateEnd: () => {},
    mapboxAccessToken: tokens.mapbox,
    zoom: 0,
    center: [0,0],
    bearing: 0,
    pitch: 0,
    options: {},
  }

  constructor(props) {
    super(props)
    MapboxGl.accessToken = tokens.mapbox
    this.state = {
      map: null,
      inspect: null,
      isPopupOpen: false,
      popupX: 0,
      popupY: 0,
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if(!this.state.map) return
    const metadata = nextProps.mapStyle.metadata || {}
    MapboxGl.accessToken = metadata['maputnik:mapbox_access_token'] || tokens.mapbox

    nextProps = Object.assign({}, this.props, nextProps);

    if(!nextProps.inspectModeEnabled) {
      //Mapbox GL now does diffing natively so we don't need to calculate
      //the necessary operations ourselves!
      this.state.map.setStyle(nextProps.mapStyle, { diff: true})

      const center = this.state.map.getCenter();

      if(
        nextProps.center.lat !== center.lat ||
        nextProps.center.lng !== center.lng
      ) {
        this.state.map.setCenter(nextProps.center);
      }

      if(nextProps.zoom !== this.state.map.getZoom()) {
        this.state.map.setZoom(nextProps.zoom);
      }

      if(nextProps.pitch !== this.state.map.getPitch()) {
        this.state.map.setPitch(nextProps.pitch);
      }

      if(nextProps.bearing !== this.state.map.getBearing()) {
        this.state.map.setBearing(nextProps.bearing);
      }

    }
  }

  componentDidUpdate(prevProps) {
    const map = this.state.map;

    if(this.props.inspectModeEnabled !== prevProps.inspectModeEnabled) {
      this.state.inspect.toggleInspector()
    }
    if(this.props.inspectModeEnabled) {
      this.state.inspect.render()
    }

    map.showTileBoundaries = this.props.options.showTileBoundaries;
  }

  componentDidMount() {
    const mapOpts = {
      ...this.props.options,
      container: this.container,
      style: this.props.mapStyle,
      hash: true,
      center: this.props.center,
      zoom: this.props.zoom,
      pitch: this.props.pitch,
      bearing: this.props.bearing,
    }

    const map = new MapboxGl.Map(mapOpts);

    map.showTileBoundaries = mapOpts.showTileBoundaries;

    const zoom = new ZoomControl;
    map.addControl(zoom, 'top-right');

    const nav = new MapboxGl.NavigationControl();
    map.addControl(nav, 'top-right');

    const props = this.props;

    const inspect = new MapboxInspect({
      popup: new MapboxGl.Popup({
        closeOnClick: false
      }),
      showMapPopup: true,
      showMapPopupOnHover: false,
      showInspectMapPopupOnHover: true,
      showInspectButton: false,
      blockHoverPopupOnClick: true,
      assignLayerColor: (layerId, alpha) => {
        return Color(colors.brightColor(layerId, alpha)).desaturate(0.5).string()
      },
      buildInspectStyle: (originalMapStyle, coloredLayers) => buildInspectStyle(originalMapStyle, coloredLayers, this.props.highlightedLayer),
      renderPopup: features => {
        if(this.props.inspectModeEnabled) {
          return renderPropertyPopup(features)
        } else {
          var mountNode = document.createElement('div');
          ReactDOM.render(<FeatureLayerPopup features={features} onLayerSelect={this.props.onLayerSelect} />, mountNode)
          return mountNode
        }
      }
    })
    map.addControl(inspect)

    map.on("style.load", () => {
      this.setState({ map, inspect });
    })

    map.on("move",    props.onMove);
    map.on("zoom",    props.onZoom);
    map.on("pitch",   props.onPitch);
    map.on("rotate",  props.onRotate);

    function getFullState() {
      const center = map.getCenter();
      return {
        latitude: center.lat,
        longitude: center.lng,
        bearing: map.getBearing(),
        zoom: map.getZoom(),
        pitch: map.getPitch()
      }
    }

    map.on("moveend", (e) => {
      props.onMoveEnd(getFullState())
    });
    map.on("zoomend", (e) => {
      props.onZoomEnd(getFullState())
    });
    map.on("pitchend", (e) => {
      props.onPitchEnd(getFullState())
    });
    map.on("rotateend", (e) => {
      props.onRotateEnd(getFullState())
    });

    map.on("data", e => {
      if(e.dataType !== 'tile') return
      props.onDataChange({
        map: this.state.map
      })
    })

    this.setState({map: map})
  }

  render() {
    return <div
      className="maputnik-map"
      ref={x => this.container = x}
    ></div>
  }
}
