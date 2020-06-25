import './styles/index.scss';

import React from 'react';
import Maputnik from './components/App';
import uiStateHelper from './api/ui-state-helper';
import {
  useStatefulUrl,
  useShortcuts,
  useUndoStack,
  useStore,
  useLoadFromUrl,
  useDebug,
  useDisableModal,
  useValidators,
} from './hooks';

import {
  validatorDisableModal
} from './validators';

export default Maputnik;
export {
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
}

