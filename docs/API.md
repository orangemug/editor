# API
The are various APIs available to Maputnik users/developers


## React component API
**Note**: This is a work in progress and subject to change.

Maputnik in its react componentized form includes everything below the toolbar. Because any integration is likely to have it's own menu system and want different things from the editor. The react API is a 'bring your own toolbar' approach.

Below is an example of the API, with comments inline


```jsx
import React, {useState} from 'react';

const STYLE = {
  // Insert style here...
}

function CustomMaputnik (props) {
  /**
   * State
   * ---------
   *
   * We're using `useState` here but you could be posting this back to your
   * database of a redux store, whatever really as long as `mapStyle` keeps
   * updated.
   */
  const [mapStyle, setMapStyle] = useState(STYLE);

  /**
   * The host app also stores the UI state allowing you to modify most things
   * from the host app. There is some internal state in the Maputnik component
   * such as 'error messages' but mostly those are caches for either mapStyle
   * (above) or uiState.
   *
   * This shows all the options currently available. Note that We'll default
   * anything that isn't provided.
   */
  const [uiState, setUiState] = useState({
    tokens: {
      "mapbox": "",
      "maptiler",
      "thunderforest": "",
    },
    layerTypes: [
      "background",
      "fill",
      "line",
      "symbol",
      "raster",
      "circle",
    ],
    mapState: "map",
    isOpen: {
      settings: false,
      sources: false,
      open: false,
      shortcuts: false,
      export: false,
      debug: false,
    },
    renderers: [
      "mbgljs",
      "ol",
    ],
    publicSources: {
      "maptiler": {
        "type": "vector",
        "url": "https://api.maptiler.com/tiles/v3/tiles.json?key={key}",
        "title": "OpenMapTiles v3"
      },
    },
    mapboxGlDebugOptions: {
      showTileBoundaries: false,
      showCollisionBoxes: false,
      showOverdrawInspector: false,
    },
    openlayersDebugOptions: {
      debugToolbox: false,
    },
    selectedLayerIndex: 0,
  });

  /**
   * A helper to modify uiState in a more obvious form
   */
  const uiAction = uiStateHelper(uiState, setUiState);

  /**
   * Plugins
   * ---------
   *
   * Plugins to provide additional features to maputnik from the external API.
   */
  useStatefulUrl({
    uiState,
    setUiState,
    mapStyle,
  });

  useShortcuts({
    uiState,
    setUiState,
    uiAction,
  });

  /**
   * Render component
   * --------
   */
  return (
    <div className="custom__maputnik">
      <div className="custom__maputnik__toolbar">
        {/* This is completely custom */}
        <CustomToolbar
          onChangeView={uiAction.changeMapState}
          onOpen={uiAction.openModal}
        />
      </div>
      <div className="custom__maputnik__editor">
        <Maputnik
          mapStyle={mapStyle}
          onMapStyleChanged={setMapStyle}
          uiState={uiState}
          onUiStateChanged={setUiState}
        />
      </div>
    </div>
  );
}
```


## URL based API
TODO


