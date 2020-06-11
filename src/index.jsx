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


function CustomMaputnik (props) {
  // Todo
  //
  //  - [ ] Add layerTypes to uiState
  //  - [x] Create uiStateHelper to modify uiState object
  //  - [ ] Move setStateInUrl/getInitialStateFromUrl
  //  - [x] Move shortcuts here
  //  - [ ] Move revision store outside of components
  //    - [x] Existing shortcurs
  //    - [ ] Move undo/redo shortcuts here also
  //  - [ ] Move debug here
  //  - [ ] Move stylestore here

  // Need a catch to stop maputnik:renderer being set
  const [style, setStyle] = useState(DEBUG_STYLE);
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
    style,
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
          style={style}
          onStyleChanged={setStyle}
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
