import './favicon.ico';
import './styles/index.scss';

import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import emptyStyle from './debug/circles';
// import emptyStyle from './config/empty-style.json';
import AppToolbar from './components/AppToolbar';
import publicSources from './config/tilesets.json';
import tokens from './config/tokens.json';

import Maputnik, {
  uiStateHelper,
  useStatefulUrl,
  useShortcuts,
  useUndoStack,
  useStore,
  useLoadFromUrl,
  useDebug,
  useDisableModal,
  useValidators,
  validatorDisableModal,
} from './index';


function CustomMaputnik (props) {
  const [mapStyle, setMapStyle] = useState(emptyStyle);
  const validators = [];

  // TODO: These options should all provide defaults
  const [uiState, setUiState] = useValidators({
    tokens: tokens,
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
      "openmaptiles": {
        "type": "vector",
        "url": "https://api.maptiler.com/tiles/v3/tiles.json?key={key}",
        "title": "OpenMapTiles v3"
      },
    },
    mapboxGlOptions: {
      showTileBoundaries: false,
      showCollisionBoxes: false,
      showOverdrawInspector: false,
    },
    openlayersOptions: {
      debugToolbox: false,
    },
    selectedLayerIndex: 0,
  }, validators);

  const uiAction = uiStateHelper(uiState, setUiState);

  /**
   * ------------
   * Plugins
   * ------------
   */
  useStatefulUrl({
    uiState,
    setUiState,
    mapStyle,
  });

  const revisionStack = useUndoStack({
    mapStyle,
    setMapStyle,
  });

  useShortcuts({
    uiState,
    setUiState,
    revisionStack,
  });

  // useWebsocketApi({
  //   mapStyle,
  //   setMapStyle,
  // });

  useStore({
    mapStyle,
    setMapStyle,
  });

  useDebug({
    revisionStack,
    mapStyle,
  });

  return (
    <div className="core__maputnik">
      <div className="core__maputnik__toolbar">
        {/* This is a core toolbar and includes whatever we want */}
        <AppToolbar
          onChangeView={uiAction.changeMapState}
          onOpen={uiAction.openModal}
          revisionStack={revisionStack}
          mapState={uiState.mapState}
          mapStyle={mapStyle}
        />
      </div>
      <div className="core__maputnik__editor">
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
