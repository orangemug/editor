import React from 'react'
import MapboxGlMap from './map/MapboxGlMap'
import JSONEditor from './layers/JSONEditor'
import lodash from 'lodash';


const DEFAULT_STATE = 'select';

function capWithin(val, min, max) {
  return Math.min(max, Math.max(val, min));
}

function roundCoord (coords, fractionDigits=4) {
  if(!coords) return;
  if(Array.isArray(coords)) {
    return coords.map(coord => {
      return coord.toFixed(fractionDigits);
    });
  }
  else {
    return {
      lat: coords.lat.toFixed(fractionDigits),
      lng: coords.lng.toFixed(fractionDigits),
    };
  }
}

class Button extends React.Component {
  render () {
    let className = "Button";
    if (this.props.selected) {
      className += " Button--selected"
    }

    return (
      <button
        disabled={this.props.disabled}
        className={className}
        onClick={this.props.onClick}
      >
        {this.props.children}
      </button>
    );
  }
}

export default class DataEditor extends React.Component {

  static defaultProps = {
    onChange: () => {}
  }

  constructor (props) {
    super(props);


    this.state = {
      mode: DEFAULT_STATE,
      geojson: this.props.geojson,
      geojsonCache: this.props.geojson,
    };
  }

  onAddLine = () => {
    this.setState({
      mode: 'line',
      cache: {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": []
        },
        "properties": {}
      }
    })
  }

  onAddPolygon = () => {
    this.setState({
      mode: 'polygon',
      cache: {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [[]]
        },
        "properties": {}
      }
    })
  }

  onAddPoint = () => {
    this.setState({
      mode: 'point',
      cache: {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": []
        },
        "properties": {}
      }
    })
  }

  updateCode = () => {
    this.setState({
      geojsonCache: this.state.geojson,
    });
    this.props.onChange(this.state.geojson);
  }

  onFinish = (removeLast) => {
    if (this.state.cache) {
      let cache = this.state.cache;
      if (this.state.mode === "polygon") {
        cache = {
          ...cache,
          geometry: {
            ...cache.geometry,
            coordinates: [
              cache.geometry.coordinates[0].slice(0, removeLast ? -2 : -1)
            ],
          }
        }
      }
      else if (this.state.mode === "line") {
        cache = {
          ...cache,
          geometry: {
            ...cache.geometry,
            coordinates: cache.geometry.coordinates.slice(0, removeLast ? -2 : -1),
          }
        }
      }

      const newGeoJSON = {
        ...this.state.geojson,
        features: [
          ...this.state.geojson.features,
          cache,
        ],
      }
      this.setState({mode: DEFAULT_STATE, geojson: newGeoJSON, cache: undefined});
      this.updateCode();
    }
    else {
      this.setState({mode: DEFAULT_STATE, cache: undefined});
    }
  }

  onAddDataPoint (e) {
    const point = this.state.mouseLocation;

    if (this.state.mode === "select") {
      const map = this.map;
      const bbox = [[e.point.x - 5, e.point.y - 5], [e.point.x + 5, e.point.y + 5]];
      var features = map.queryRenderedFeatures(bbox, {
        layers: [
          'debug-polygon',
          'debug-line',
          'debug-point',
        ]
      });

      if (features.length > 0) {
        this.setState({
          selected: features[0].id
        });
      }
      else {
        this.setState({
          selected: null,
        });
      }
    }
    else if (this.state.mode === "point") {
      this.setState({
        cache: {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [
              point.lng, point.lat
            ]
          },
          "properties": {}
        }
      });
      this.onFinish();
    }
    else if (this.state.mode === "line") {
      this.setState({
        cache: {
          "type": "Feature",
          "geometry": {
            "type": "LineString",
            "coordinates": (this.state.cache ? this.state.cache.geometry.coordinates : []).concat([
              [point.lng, point.lat]
            ])
          },
          "properties": {}
        }
      })
    }
    else if (this.state.mode === "polygon") {
      this.setState({
        cache: {
          "type": "Feature",
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              (this.state.cache ? this.state.cache.geometry.coordinates[0] : []).concat([
                [point.lng, point.lat]
              ])
            ]
          },
          "properties": {}
        }
      })
    }
  }

  onRemove = () => {
    const index = this.state.selected;

    if (index < 0) {
      return;
    }

    const {geojson} = this.state;
    const {features} = geojson;
    const newGeoJSON = {
      ...geojson,
      features: [
        ...features.slice(0, index),
        ...features.slice(index+1),
      ]
    }

    this.setState({
      selected: null,
      geojson: newGeoJSON,
    }, () => {
      this.updateCode();
    });
  }

  componentDidMount () {
    document.body.addEventListener('keydown', (e) => {
      const actions = {
        "backspace": () => {
          this.onRemove();
        },
        "escape": () => {
          this.onSelect();
        },
        "p": () => {
          this.onAddPoint()
        },
        "l": () => {
          this.onAddLine();
        },
        "s": () => {
          this.onAddPolygon();
        },
        "c": () => {
          this.onCancel();
        },
        "e": () => {
          this.onFinish();
        },
      }
      const key = e.key.toLowerCase();
      if (actions[key]) {
        actions[key]();
      }
    }, false)
  }

  onCancel = () => {
    this.setState({
      mode: DEFAULT_STATE,
      selected: null,
      cache: undefined,
    })
  }

  onUnselectHandle = (e) => {
    this.map.dragPan.enable();
    this.map.dragRotate.enable();

    this.setState({
      selectedHdl: undefined,
    });
    this.updateCode();
  }

  setCoords = (layer, idx, val) => {
    const {type} = layer.geometry;
    if (type === "Polygon") {
      layer.geometry.coordinates[0][idx] = val;
    }
    else if (type === "LineString"){
      layer.geometry.coordinates[idx] = val;
    }
    else if (type === "Point") {
      layer.geometry.coordinates = val;
    }
  }

  onMoveHandle = (e) => {
    const ll = e.lngLat;
    if (this.state.selectedHdl) {
      const layer = this.state.geojson.features.find((f, idx) => idx === this.state.selectedHdl.$remoteId);

      const {selectedHdl} = this.state;

      this.setCoords(layer, selectedHdl.$remoteIdx, [
        capWithin(ll.lng+this._offset, -360, 360),
        ll.lat,
      ])

      this.setState({
        geojson: {
          ...this.state.geojson
        }
      });
    }
  }

  onSelectHandle = (e) => {
    const ll = e.lngLat;
    const bbox = [[e.point.x - 5, e.point.y - 5], [e.point.x + 5, e.point.y + 5]];
    var features = this.map.queryRenderedFeatures(bbox, {
      layers: [
        'debug-hdl',
      ]
    });

    if (features.length < 1) return;

    this.map.dragPan.disable();
    this.map.dragRotate.disable();

    const props = features[0].properties;

    const layer = this.state.geojson.features.find((f, idx) => idx === props.$id);
    const coords = layer.geometry.coordinates[0][props.$idx];
    this._offset = 0;
    if (coords[0] < -180 && ll.lng > -180) {
      this._offset = -360;
    }
    else if (coords[0] > 180 && ll.lng < 180) {
      this._offset = +360;
    }

    this.setState({
      selectedHdl: {
        $remoteId: props.$id,
        $remoteIdx: props.$idx,
      }
    });
  }

  onMap = (map) => {
    map.on('mousemove', (e) => {
      const ll = e.lngLat;
      this.setState({
        mouseLocation: {lat: ll.lat, lng: ll.lng}
      })

      if (this.state.cache) {
        if (this.state.mode === "polygon") {
          const coords = this.state.cache.geometry.coordinates[0];
          coords[Math.max(coords.length-1, 0)] = [
            ll.lng, ll.lat
          ];

          this.setState({
            cache: {
              ...this.state.cache,
              geometry: {
                ...this.state.cache.geometry,
                coordinates: [coords]
              }
            }
          });
        }
        else if (this.state.mode === "point") {
          const geom = this.state.cache.geometry;
          geom.coordinates = [
            ll.lng, ll.lat
          ];

          this.setState({
            cache: {
              ...this.state.cache,
              geometry: geom,
            }
          });
        }
        else if (this.state.mode === "line") {
          const coords = this.state.cache.geometry.coordinates;
          coords[Math.max(coords.length-1, 0)] = [
            ll.lng, ll.lat
          ];

          this.setState({
            cache: {
              ...this.state.cache,
              geometry: {
                ...this.state.cache.geometry,
                coordinates: coords
              }
            }
          });
        }
      }
    })

    this.map = map;

    map.on('dblclick', (e) => {
      if (this.state.mode !== "select") {
        this.onFinish(true);
        e.preventDefault();
      }
    });

    map.on('mousedown', (e) => {
      this.onSelectHandle(e);
    });

    map.on('mousemove', lodash.throttle((e) => {
      this.onMoveHandle(e);
    }, 1000/15));

    map.on('mouseup', (e) => {
      this.onUnselectHandle(e);
    });

    map.on('click', (e) => {
      this.onAddDataPoint(e);
    })
  }

  onSelect = () => {
    this.onFinish();
    this.setState({
      mode: 'select'
    })
  }

  getHandles (feature, id) {
    let coords;
    const type = feature.geometry.type;
    if (type === "Polygon") {
      coords = feature.geometry.coordinates[0];
    }
    else if (type === "LineString"){
      coords = feature.geometry.coordinates;
    }
    else if (type === "Point"){
      coords = [feature.geometry.coordinates];
    }
    const features = coords.map((coord, idx) => {

      const isSelected = !!(
        this.state.selectedHdl &&
        id === this.state.selectedHdl.$remoteId &&
        idx === this.state.selectedHdl.$remoteIdx
      );

      return {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": coord
        },
        "properties": {
          is_debug: true,
          is_selected: isSelected,
          $id: id,
          $idx: idx,
        }
      }
    });

    return features;
  }

  setGeoJSON (geojson) {
    this.setState({
      geojson,
    });
    this.updateCode();
  }

  render () {

    const selectedIndex = this.state.geojson.features.findIndex((f, idx) => {
      return idx === this.state.selected;
    });

    const geojson = {
      ...this.state.geojson,
      features: [
        ...this.state.geojson.features,
        ...(selectedIndex > -1 ? this.getHandles(this.state.geojson.features[selectedIndex], selectedIndex) : []),
      ]
    }

    const mapStyle = {
      ...this.props.mapStyle,
      sources: {
        ...this.props.mapStyle.sources,
        "__geojson": {
          "type": "geojson",
          generateId: true,
          "data": geojson,
        }
      },
      layers: [
        ...this.props.mapStyle.layers,
        {
          "id": "debug-background",
          "type": "background",
          "filter": [
            "==", "$type", "Polygon"
          ],
          "paint": {
            "background-color": "hsla(0, 0%, 100%, 0.4)"
          }
        },
        {
          "id": "debug-polygon",
          "type": "fill",
          "source": "__geojson",
          "filter": [
            "all",
            ["==", "$type", "Polygon"],
            ["!=", "is_debug", true],
          ],
          "paint": {
            "fill-outline-color": "hsla(0, 0%, 0%, 1)",
            "fill-color": "hsla(0, 0%, 0%, 0.3)",
          }
        },
        {
          "id": "debug-line",
          "type": "line",
          "source": "__geojson",
          "filter": [
            "any", 
            [
              "all",
              ["==", "$type", "Polygon"],
              ["!=", "is_debug", true],
            ],
            [
              "all",
              ["==", "$type", "LineString"],
              ["!=", "is_debug", true],
            ],
          ],
          "paint": {
            "line-color": "hsla(0, 0%, 0%, 1)",
            "line-width": 2,
          }
        },
        {
          "id": "debug-point",
          "type": "circle",
          "source": "__geojson",
          "filter": [
            "all",
            ["==", "$type", "Point"],
            ["!=", "is_debug", true],
          ],
          "paint": {
            "circle-radius": 2,
            "circle-color": "hsla(0, 0%, 0%, 0.3)",
            "circle-stroke-color": "hsla(0, 0%, 0%, 1)",
            "circle-stroke-width": 1,
          }
        },
        {
          "id": "debug-hdl",
          "type": "circle",
          "source": "__geojson",
          "filter": [
            "all",
            ["==", "is_debug", true],
            ["==", "is_selected", false],
          ],
          "paint": {
            "circle-radius": 4,
            "circle-color": "hsla(0, 100%, 50%, 0.3)",
            "circle-stroke-color": "hsla(0, 100%, 50%, 1)",
            "circle-stroke-width": 1,
          }
        },
        {
          "id": "debug-hdl-selected",
          "type": "circle",
          "source": "__geojson",
          "filter": [
            "all",
            ["==", "is_debug", true],
            ["==", "is_selected", true],
          ],
          "paint": {
            "circle-radius": 4,
            "circle-color": "hsla(120, 100%, 50%, 0.3)",
            "circle-stroke-color": "hsla(120, 100%, 50%, 1)",
            "circle-stroke-width": 1,
          }
        }
      ]
    }

    if (this.state.cache) {
      geojson.features.push(this.state.cache);
    }

    const {mode} = this.state;

    return (
      <div className="DataEditor">
        <div className="DataEditor__editor" key="editor">
          <JSONEditor
            layer={this.state.geojsonCache}
            onChange={(geojson) => {
              this.setGeoJSON(geojson);
            }}
          />
        </div>
        <div
          key="map"
          className={`DataEditor__map DataEditor__map--${this.state.mode !== DEFAULT_STATE ? 'editing' : 'not-editing'}`}
        >
          <div className="DataEditor__toolbox" key="toolbox">
            <Button
              selected={mode==='select'}
              onClick={this.onSelect}
            >
              <svg style={{width:"24px", height:"24px"}} viewBox="0 0 24 24">
              <path fill="#000000" d="M10.07,14.27C10.57,14.03 11.16,14.25 11.4,14.75L13.7,19.74L15.5,18.89L13.19,13.91C12.95,13.41 13.17,12.81 13.67,12.58L13.95,12.5L16.25,12.05L8,5.12V15.9L9.82,14.43L10.07,14.27M13.64,21.97C13.14,22.21 12.54,22 12.31,21.5L10.13,16.76L7.62,18.78C7.45,18.92 7.24,19 7,19A1,1 0 0,1 6,18V3A1,1 0 0,1 7,2C7.24,2 7.47,2.09 7.64,2.23L7.65,2.22L19.14,11.86C19.57,12.22 19.62,12.85 19.27,13.27C19.12,13.45 18.91,13.57 18.7,13.61L15.54,14.23L17.74,18.96C18,19.46 17.76,20.05 17.26,20.28L13.64,21.97Z" />
              </svg>
            </Button>
            <Button
              disabled={mode!=="select"}
              selected={mode==='point'}
              onClick={this.onAddPoint}
            >
              <svg style={{width:"24px", height:"24px"}} viewBox="0 0 24 24">
                <path fill="#000000" d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" />
              </svg>
            </Button>
            <Button
              disabled={mode!=="select"}
              selected={mode==='line'}
              onClick={this.onAddLine}
            >
              <svg style={{width:"24px", height:"24px"}} viewBox="0 0 24 24">
                <path fill="#000000" d="M15,3V7.59L7.59,15H3V21H9V16.42L16.42,9H21V3M17,5H19V7H17M5,17H7V19H5" />
              </svg>
            </Button>
            <Button
              disabled={mode!=="select"}
              selected={mode==='polygon'}
              onClick={this.onAddPolygon}
            >
              <svg style={{width:"24px", height:"24px"}} viewBox="0 0 24 24">
                <path fill="#000000" d="M2,2V8H4.28L5.57,16H4V22H10V20.06L15,20.05V22H21V16H19.17L20,9H22V3H16V6.53L14.8,8H9.59L8,5.82V2M4,4H6V6H4M18,5H20V7H18M6.31,8H7.11L9,10.59V14H15V10.91L16.57,9H18L17.16,16H15V18.06H10V16H7.6M11,10H13V12H11M6,18H8V20H6M17,18H19V20H17" />
              </svg>
            </Button>
            <Button
              onClick={this.onFinish}
              disabled={['line', 'polygon'].indexOf(mode) < 0}
            >
              <svg style={{width:"24px", height:"24px"}} viewBox="0 0 24 24">
                <path fill="#000000" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4M9,9V15H15V9" />
              </svg>
            </Button>
            <Button
              disabled={['line', 'polygon', 'point'].indexOf(mode) < 0}
              onClick={this.onCancel}
            >
              <svg style={{width:"24px", height:"24px"}} viewBox="0 0 24 24">
                <path fill="#000000" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
              </svg>
            </Button>
            <Button
              disabled={selectedIndex < 0}
              onClick={() => this.onRemove()}
            >
              <svg style={{width:"24px", height:"24px"}} viewBox="0 0 24 24">
                <path fill="#000000" d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z" />
              </svg>
            </Button>
          </div>
          <MapboxGlMap
            inspectModeEnabled={false}
            disableInspect={true}
            mapStyle={mapStyle}
            onMap={this.onMap}
          />
        </div>
      </div>
    );
  }
}
