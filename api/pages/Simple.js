import React, {useState} from "react";

import './Simple.scss';
import '../../src/favicon.ico';
import '../../src/styles/index.scss';

import emptyStyle from '../../src/debug/circles';
import Toolbar from '../../src/debug/toolbar';
import publicSources from '../../src/config/tilesets.json';
import tokens from '../../src/config/tokens.json';

import Maputnik, {
  uiStateHelper,
  useStatefulUrl,
  useShortcuts,
  useUndoStack,
  useLoadFromUrl,
  useDebug,
  useDisableModal,
  useValidators,
  validatorDisableModal,
} from '../../src/index';


const BEARER_TOKEN = "testing-testing-123";

function CustomMaputnik (props) {
  const [mapStyle, setMapStyle] = useState(emptyStyle);
  const [theme, setTheme] = useState('ant-design');

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

  useDebug({
    revisionStack,
    mapStyle,
  });

  const transformRequest = (url, resourceType) => {
    if (
      resourceType === 'Source' &&
      url.startsWith('http://localhost:8080/editor/api/public')
    ) {
      return {
        url: url,
        headers: {
          "Authorization": "Bearer "+BEARER_TOKEN,
        },
        credentials: 'include'
      }
    }
  }

  const onChangeTheme = (e) => {
    setTheme(e.target.value);
  };

  const additional = (
    <div>
      <label>
        Theme{' '}
        <select onChange={onChangeTheme} value={theme}>
          {["ant-design", "light", "material-design"].map(theme => {
            return (
              <option value={theme}>{theme}</option>
            );
          })}
        </select>
      </label>
    </div>
  );

  return (
    <div className="custom__maputnik">
      <div className="custom__maputnik__toolbar">
        {/* This is a custom toolbar and includes whatever we want */}
        <Toolbar
          onChangeView={uiAction.changeMapState}
          onOpen={uiAction.openModal}
          revisionStack={revisionStack}
          additional={additional}
        />
      </div>
      <div className="custom__maputnik__editor">
        {/* The Maputnik editor view */}
        <Maputnik
          mapStyle={mapStyle}
          theme={theme}
          onMapStyleChanged={setMapStyle}
          transformRequest={transformRequest}
          uiState={uiState}
          onUiStateChanged={setUiState}
        />
      </div>
    </div>
  );
}

export default function Simple () {
  return <div className="Simple">
    <CustomMaputnik />
  </div>
}
