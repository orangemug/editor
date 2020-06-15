import {useEffect} from 'react';
import uiStateHelper from '../api/ui-state-helper';

export default function useShortcuts ({uiState, setUiState, revisionStack}) {
  const uiAction = uiStateHelper(uiState, setUiState);

  const effectHandler = () => {
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

      const isMac = (navigator.platform.toUpperCase().indexOf('MAC') >= 0)
      const isUndo = (
        (isMac && e.metaKey && e.keyCode === 90) ||
        (!isMac && e.ctrlKey && e.keyCode === 90)
      );
      const isRedo = (
        (isMac && e.metaKey && e.shiftKey && e.keyCode === 90) ||
        (!isMac && e.ctrlKey && e.keyCode === 89)
      );

      if (isUndo) {
        e.preventDefault();
        revisionStack.onUndo(e);
      }
      else if(isRedo) {
        e.preventDefault();
        revisionStack.onRedo(e);
      }
      else if (e.key === "Escape") {
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

    document.body.addEventListener("keydown", handleKeyUp);

    return () => {
      document.body.removeEventListener("keydown", handleKeyUp);
    }
  }

  useEffect(effectHandler, [uiState, setUiState, revisionStack]);
}

