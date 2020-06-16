import React from 'react'
import MapMapboxGl from './MapMapboxGl'
import MapOpenLayers from './MapOpenLayers'
import style from '../libs/style'


export default function MapGeneric (props) {
    const {
      mapStyle,
      renderer,
      dirtyMapStyle,
      mapState,
      mapboxGlOptions,
      openlayersOptions,
      selectedLayerIndex,
    } = props;
    const metadata = mapStyle.metadata || {};

    const mapProps = {
      mapStyle: (dirtyMapStyle || mapStyle),
      replaceAccessTokens: (mapStyle) => {
        return style.replaceAccessTokens(mapStyle, {
          allowFallback: true
        });
      },
      onDataChange: props.onDataChange,
    }

    let mapElement;

    // Check if OL code has been loaded?
    if(renderer === 'ol') {
      mapElement = <MapOpenLayers
        {...mapProps}
        onChange={props.onChangeMapView}
        debugToolbox={openlayersOptions.debugToolbox}
        onLayerSelect={props.onLayerSelect}
      />
    } else {
      mapElement = <MapMapboxGl {...mapProps}
        onChange={props.onChangeMapView}
        options={mapboxGlOptions}
        inspectModeEnabled={mapState === "inspect"}
        highlightedLayer={mapStyle.layers[selectedLayerIndex]}
        onLayerSelect={props.onLayerSelect} />
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
