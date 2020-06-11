const setStateInUrl = () => {
  const {mapState, mapStyle, isOpen} = this.state;
  const {selectedLayerIndex} = this.state;
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

const getInitialStateFromUrl = (mapStyle) => {
  const url = new URL(location.href);
  const modalParam = url.searchParams.get("modal");
  if (modalParam && modalParam !== "") {
    const modals = modalParam.split(",");
    const modalObj = {};
    modals.forEach(modalName => {
      modalObj[modalName] = true;
    });

    this.setState({
      isOpen: {
        ...this.state.isOpen,
        ...modalObj,
      }
    });
  }

  const view = url.searchParams.get("view");
  if (view && view !== "") {
    this.setMapState(view);
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
        this.setState({selectedLayerIndex});
      }
    }
    catch (err) {
      console.warn(err);
    }
  }
}

export default function stateInSearchParamsEffect ({uiState, style}) {
  return () => {
  };
}
