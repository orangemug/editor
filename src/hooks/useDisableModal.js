import {useEffect} from 'react';

export default function ({uiState, setUiState}) {
  useEffect(() => {
    if (uiState.isOpen.open) {
      setUiState({
        ...uiState,
        isOpen: {
          ...uiState.isOpen,
          open: false,
        }
      });
    }
  }, [uiState, setUiState]);
}
