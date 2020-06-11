import React from 'react';

export default function Toolbar (props) {
  return <nav>
    <button onClick={e => props.onOpen("settings")}>
      Style settings
    </button>
    <select onChange={e => props.onChangeView(e.target.value)}>
      <option value="map">
        Map
      </option>
      <option value="inspect">
        Inspect 
      </option>
    </select>
  </nav>
}
