import React from 'react';


export default function Toolbar (props) {
  const {revisionStack, additional} = props;

  return <nav>
    <button onClick={e => props.onOpen("settings")}>
      Style settings
    </button>
    <label>
      View&nbsp;
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
      <button
        onClick={revisionStack.onUndo}
        disabled={!revisionStack.canUndo()}
      >
        Undo
      </button>
      <button
        onClick={revisionStack.onRedo}
        disabled={!revisionStack.canRedo()}
      >
        Redo
      </button>
      <div style={{display: "inline-flex"}}>
        {additional}
      </div>
    </label>
  </nav>
}
