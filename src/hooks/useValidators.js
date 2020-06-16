import {useState} from 'react';


export default function useValidators (props, validators) {
  function runValidators (props) {
    validators.forEach(validator => {
      props = validator(props);
    });
    return props;
  }

  const [uiState, setUiState] = useState(runValidators(props));

  return [
    uiState,
    function (props) {
      return setUiState(runValidators(props));
    },
  ];
}

