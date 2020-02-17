import {mdiMagnify} from '@mdi/js';


export default class ZoomControl {
  onAdd(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group mapboxgl-ctrl-zoom';
    this._container.innerHTML = `
      <svg
        style="width: 14px; height: 14px; vertical-align: middle;"
        viewBox="0 0 24 24"
      >
        <title>Zoom level</title>
        <path fill="currentColor" d="${mdiMagnify}" />
      </svg> <span></span>
    `;
    this._textEl = this._container.querySelector("span");
    
    this.addEventListeners();
    
    return this._container;
  }
  
  updateZoomLevel() {
    this._textEl.innerHTML = this._map.getZoom().toFixed(2);
  }
  
  addEventListeners (){
    this._map.on('render', this.updateZoomLevel.bind(this) );
    this._map.on('zoomIn', this.updateZoomLevel.bind(this) );
    this._map.on('zoomOut', this.updateZoomLevel.bind(this) );
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}
