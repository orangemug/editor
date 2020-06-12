import {useEffect} from 'react';
import hash from 'string-hash';


const onUpdate = ({uiState, mapStyle}) => {
  return () => {
    const {mapState, selectedLayerIndex, isOpen} = uiState;
    const url = new URL(location.href);
    const hashVal = hash(JSON.stringify(mapStyle));
    url.searchParams.set("layer", `${hashVal}~${selectedLayerIndex}`);

    const openModals = Object.entries(isOpen)
    .map(([key, val]) => (val === true ? key : null))
    .filter(val => val !== null);

    if (openModals.length > 0) {
      url.searchParams.set("modal", openModals.join(","));
    }
    else {
      url.searchParams.delete("modal");
    }

    if (mapState === "map") {
      url.searchParams.delete("view");
    }
    else if (mapState === "inspect") {
      url.searchParams.set("view", "inspect");
    }

    history.replaceState({selectedLayerIndex}, "Maputnik", url.href);
  }
}

const onMount = ({uiState, setUiState, mapStyle}) => {
  return () => {
    const url = new URL(location.href);
    const modalParam = url.searchParams.get("modal");
    if (modalParam && modalParam !== "") {
      const modals = modalParam.split(",");
      const modalObj = {};
      modals.forEach(modalName => {
        modalObj[modalName] = true;
      });

      uiState = {
        ...uiState,
        isOpen: {
          ...uiState.isOpen,
          ...modalObj,
        }
      };
    }

    const view = url.searchParams.get("view");
    if (view && view !== "") {
      uiState = {
        ...uiState,
        mapState
      };
    }

    const path = url.searchParams.get("layer");
    if (path) {
      try {
        const parts = path.split("~");
        const [hashVal, selectedLayerIndex] = [
          parts[0],
          parseInt(parts[1], 10),
        ];

        let invalid = false;
        if (hashVal !== "-") {
          const currentHashVal = hash(JSON.stringify(mapStyle));
          if (currentHashVal !== parseInt(hashVal, 10)) {
            invalid = true;
          }
        }
        if (!invalid) {
          uiState = {
            ...uiState,
            selectedLayerIndex
          };
        }
      }
      catch (err) {
        console.warn(err);
      }
    }

    // Kind of a HACK setting state on mount, works for now.
    setUiState(uiState);
  }
}

export default function (opts) {
  useEffect(onMount(opts), []);
  useEffect(onUpdate(opts));
}

