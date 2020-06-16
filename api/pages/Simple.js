import React, {useState} from "react";

import '../../src/favicon.ico';
import '../../src/styles/index.scss';

import emptyStyle from '../../src/debug/circles';
// import emptyStyle from './src/config/empty-style.json';
import Toolbar from '../../src/debug/toolbar';
import publicSources from '../../src/config/tilesets.json';
import tokens from '../../src/config/tokens.json';

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
} from '../../src/index';


function CustomMaputnik (props) {
  const [mapStyle, setMapStyle] = useState(emptyStyle);

  const validators = [
    validatorDisableModal(["open"]),
  ];

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
    history: props.history || history,
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
    <div className="custom__maputnik">
      <div className="custom__maputnik__toolbar">
        {/* This is a custom toolbar and includes whatever we want */}
        <Toolbar
          onChangeView={uiAction.changeMapState}
          onOpen={uiAction.openModal}
          revisionStack={revisionStack}
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

export default function Simple () {
  return <div style={{flex: 1, display: "flex"}}>
		<CustomMaputnik />
	</div>
}
