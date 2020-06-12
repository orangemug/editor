import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';

import './favicon.ico'
import './styles/index.scss'
import Maputnik, {uiStateConfigurator} from './components/App';
import shortcutEffect from './hooks/shortcuts';
import stateInSearchParamsEffect from './hooks/state-in-search-params';
import DEBUG_STYLE from './debug/circles';
import uiStateHelper from './api/ui-state-helper';
import Toolbar from './debug/toolbar';
import publicSources from './config/tilesets.json'


function CustomMaputnik (props) {
  // Todo
  //
  //  - [x] Add layerTypes to uiState
  //  - [x] Make public data sources configurable
  //  - [x] Create uiStateHelper to modify uiState object
  //  - [ ] Move setStateInUrl/getInitialStateFromUrl
  //  - [x] Move shortcuts here
  //  - [ ] Move revision store outside of components
  //    - [x] Existing shortcurs
  //    - [ ] Move undo/redo shortcuts here also
  //  - [ ] Move debug here
  //  - [ ] Move stylestore here

  // Need a catch to stop maputnik:renderer being set
  const [mapStyle, setMapStyle] = useState(DEBUG_STYLE);
  const [uiState, setUiState] = useState({
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
    // publicSources: publicSources,
    publicSources: {
      "openmaptiles": {
        "type": "vector",
        "url": "https://api.maptiler.com/tiles/v3/tiles.json?key={key}",
        "title": "OpenMapTiles v3"
      },
    },
    // TODO: Default this...
    mapboxGlDebugOptions: {
      showTileBoundaries: false,
      showCollisionBoxes: false,
      showOverdrawInspector: false,
    },
    // TODO: Default this...
    selectedLayerIndex: 0,
  });

  const uiAction = uiStateHelper(uiState, setUiState);

  // --------
  // Effects
  // --------
  useEffect(shortcutEffect({
    uiState,
    setUiState,
    uiAction,
  }), []);

  // setStateInUrl/getInitialStateFromUrl
  useEffect(stateInSearchParamsEffect({
    uiState,
    mapStyle,
  }, []));

  return (
    <div className="custom__maputnik">
      <div className="custom__maputnik__toolbar">
        {/* This is a custom toolbar and includes whatever we want */}
        <Toolbar
          onChangeView={uiAction.changeMapState}
          onOpen={uiAction.openModal}
        />
      </div>
      <div className="custom__maputnik__editor">
        {/* The Maputnik editor view */}
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

ReactDOM.render(
  <CustomMaputnik />,
  document.querySelector("#app")
);

// Hide the loader.
document.querySelector(".loading").style.display = "none";
