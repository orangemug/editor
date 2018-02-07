import React from 'react'
import PropTypes from 'prop-types'
import style from '../../libs/style.js'
import isEqual from 'lodash.isequal'
import { loadJSON } from '../../libs/urlopen'
import 'ol/ol.css'


class OpenLayers3Map extends React.Component {
  static propTypes = {
    onDataChange: PropTypes.func,
    onViewChange: PropTypes.func,
    mapStyle: PropTypes.object.isRequired,
    accessToken: PropTypes.string,
    style: PropTypes.object,
  }

  static defaultProps = {
    onMapLoaded: () => {},
    onViewChange: () => {},
    onDataChange: () => {},
    lat: 0,
    lng: 0,
    zoom: 0,
  }

  constructor(props) {
    super(props)
    this.map = null
  }

  updateStyle(newMapStyle) {
    const olms = require('ol-mapbox-style');
    const styleFunc = olms.apply(this.map, newMapStyle)
  }

  componentWillReceiveProps(nextProps) {
    require.ensure(["ol", "ol-mapbox-style"], () => {
      if(!this.map) return

      this.updateStyle(nextProps.mapStyle);

      // TODO: Conditional check doens't work...
      // if (this.props.zoom != nextProps.zoom) {
        this.map.getView().setZoom(nextProps.zoom);
      // }

      // TODO: Conditional check doens't work...
      // if (
      //   this.props.lng != nextProps.lng
      //   || this.props.lat != nextProps.lat
      // ) {
        const proj = require('ol/proj').default;
        const center = proj.transform([this.props.lng, this.props.lat], "EPSG:4326", 'EPSG:3857');
        this.map.getView().setCenter(center)
      // }
    })

  }

  onChange() {
    const proj = require('ol/proj').default;
    const zoom = this.map.getView().getZoom();
    const center = this.map.getView().getCenter();

    const [lng, lat] = proj.transform(center, 'EPSG:3857', "EPSG:4326");
    this.props.onViewChange({lng, lat, zoom})
  }

  componentDidMount() {
    //Load OpenLayers dynamically once we need it
    //TODO: Make this more convenient
    require.ensure(["ol", "ol/map", "ol/view", "ol/control/zoom", "ol-mapbox-style"], ()=> {
      console.log('Loaded OpenLayers3 renderer')

      const olMap = require('ol/map').default
      const olView = require('ol/view').default
      const olZoom = require('ol/control/zoom').default


      const proj = require('ol/proj').default;

      const map = new olMap({
        target: this.container,
        layers: [],
        view: new olView({
          zoom: this.props.zoom,
          center: proj.transform([this.props.lng, this.props.lat], "EPSG:4326", 'EPSG:3857')
        })
      })

      map.on("moveend", () => this.onChange())

      map.addControl(new olZoom())
      this.map = map
      this.updateStyle(this.props.mapStyle)
    })
  }

  render() {
    return <div
      ref={x => this.container = x}
      style={{
        position: "fixed",
        top: 40,
        right: 0,
        bottom: 0,
        height: 'calc(100% - 40px)',
        width: "75%",
        backgroundColor: '#fff',
        ...this.props.style,
      }}>
    </div>
  }
}

export default OpenLayers3Map
