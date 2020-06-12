import {useEffect} from 'react';

export default function useShortcuts ({uiState, setUiState, uiAction}) {
  const handler = () => {
    const handleKeyUp = (e) => {
      const shortcuts = [
        {
          key: "?",
          handler: () => {
            uiAction.toggleModal("shortcuts");
          }
        },
        {
          key: "o",
          handler: () => {
            uiAction.toggleModal("open");
          }
        },
        {
          key: "e",
          handler: () => {
            uiAction.toggleModal("export");
          }
        },
        {
          key: "d",
          handler: () => {
            uiAction.toggleModal("sources");
          }
        },
        {
          key: "s",
          handler: () => {
            uiAction.toggleModal("settings");
          }
        },
        {
          key: "i",
          handler: () => {
            this.setMapState(
              this.state.mapState === "map" ? "inspect" : "map"
            );
          }
        },
        {
          key: "m",
          handler: () => {
            document.querySelector(".mapboxgl-canvas").focus();
          }
        },
        {
          key: "!",
          handler: () => {
            uiAction.toggleModal("debug");
          }
        },
      ];

      if(e.key === "Escape") {
        e.target.blur();
        document.body.focus();
      }
      else if(uiState.isOpen.shortcuts || document.activeElement === document.body) {
        const shortcut = shortcuts.find((shortcut) => {
          return (shortcut.key === e.key)
        })

        if(shortcut) {
          uiAction.openModal("shortcuts", false);
          shortcut.handler(e);
        }
      }
    }

    document.body.addEventListener("keyup", handleKeyUp);

    return () => {
      document.body.removeEventListener("keyup", handleKeyUp);
    }
  }

  useEffect(handler, []);
}

