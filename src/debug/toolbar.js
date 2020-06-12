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
      <optgroup label="Accessibility color filters">
        <option value="filter-deuteranopia">
          Deuteranopia filter
        </option>
        <option value="filter-protanopia">
          Protanopia filter
        </option>
        <option value="filter-tritanopia">
          Tritanopia filter
        </option>
        <option value="filter-achromatopsia">
          Achromatopsia filter
        </option>
      </optgroup>
    </select>
  </nav>
}
