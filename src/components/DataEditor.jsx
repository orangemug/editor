import React from 'react'
import MapboxGlMap from './map/MapboxGlMap'
import JSONEditor from './layers/JSONEditor'
import lodash from 'lodash';


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

export default class DataEditor extends React.Component {

  constructor (props) {
    super(props);

    const geojson = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {
            $id: Math.random(),
          },
          "geometry": {
            "type": "LineString",
            "coordinates": [
              [
                -17.9296875,
                55.57834467218206
              ],
              [
                -54.140625,
                19.642587534013032
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "properties": {
            $id: Math.random(),
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              [
                [
                  -14.765625,
                  31.052933985705163
                ],
                [
                  -10.1953125,
                  9.795677582829743
                ],
                [
                  -3.1640625,
                  36.31512514748051
                ],
                [
                  -3.8671874999999996,
                  42.032974332441405
                ],
                [
                  -14.765625,
                  31.052933985705163
                ]
              ]
            ]
          }
        },
        {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [-77.0323, 38.9131]
          },
          "properties": {
            $id: Math.random(),
            "title": "Mapbox DC",
            "marker-symbol": "monument"
          }
        }
      ]
    }

    this.state = {
      mode: 'none',
      geojson: geojson,
      geojsonCache: geojson,
    };
  }

  onAddLine = () => {
    this.setState({
      mode: 'line',
    })
  }

  onAddPolygon = () => {
    this.setState({
      mode: 'polygon',
    })
  }

  onAddPoint = () => {
    this.setState({
      mode: 'point',
    })
  }

  onMove = () => {
    this.setState({
      mode: 'move',
    })
  }

  updateCode = () => {
    this.setState({
      geojsonCache: this.state.geojson,
    });
  }

  onFinish = () => {
    const newGeoJSON = {
      ...this.state.geojson,
      features: [
        ...this.state.geojson.features,
        this.state.cache,
      ],
    }
    this.setState({mode: 'none', geojson: newGeoJSON, cache: undefined});
    this.updateCode();
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
          selected: features[0].properties.$id
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

  onCancel = () => {
    this.setState({
      mode: 'none',
      selected: null,
      cache: undefined,
    })
  }

  onUnselectHandle = (e) => {
    console.log("onUnselectHandle")
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
    const ll = e.lngLat.wrap()
    if (this.state.selectedHdl) {
      const layer = this.state.geojson.features.find(f => f.properties.$id === this.state.selectedHdl.$remoteId);

      const {selectedHdl} = this.state;

      this.setCoords(layer, selectedHdl.$remoteIdx, [
        ll.lng,
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
    const bbox = [[e.point.x - 5, e.point.y - 5], [e.point.x + 5, e.point.y + 5]];
    var features = this.map.queryRenderedFeatures(bbox, {
      layers: [
        'debug-hdl',
      ]
    });

    if (features.length < 1) return;

    console.log("onSelectHandle");
    this.map.dragPan.disable();
    this.map.dragRotate.disable();

    const props = features[0].properties;
    this.setState({
      selectedHdl: {
        $remoteId: props.$id,
        $remoteIdx: props.$idx,
      }
    });
  }

  onMap = (map) => {
    map.on('mousemove', (e) => {
      const ll = e.lngLat.wrap()
      this.setState({
        mouseLocation: {lat: ll.lat, lng: ll.lng}
      })
    })

    this.map = map;

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
    this.setState({
      mode: 'select'
    })
  }

  getHandles (feature) {
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
        feature.properties.$id === this.state.selectedHdl.$remoteId &&
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
          $id: feature.properties.$id,
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

    const selected = this.state.geojson.features.find(f => {
      return f.properties.$id === this.state.selected;
    });

    const geojson = {
      ...this.state.geojson,
      features: [
        ...this.state.geojson.features,
        ...(selected ? this.getHandles(selected) : []),
      ]
    }

    const mapStyle = {
      ...this.props.mapStyle,
      sources: {
        ...this.props.mapStyle.sources,
        "__geojson": {
          "type": "geojson",
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

    return (
      <div style={{height: "100%", width: "100%", top: 0, position: "absolute", display: 'flex', flexDirection: 'column'}}>
        <div key="editor" style={{height: "50%", overflow: "auto"}}>
          <JSONEditor
            layer={this.state.geojsonCache}
            onChange={(geojson) => {
              this.setGeoJSON(geojson);
            }}
          />
        </div>
        <div key="toolbox">
          <button onClick={this.onSelect}>Select</button>
          <button onClick={this.onAddPoint}>Point</button>
          <button onClick={this.onAddLine}>Lines</button>
          <button onClick={this.onAddPolygon}>Polygon</button>
          <button onClick={this.onFinish}>Finish</button>
          <button onClick={this.onMove}>Move</button>
          <button onClick={this.onCancel}>Cancel</button>
          <span>{JSON.stringify(roundCoord(this.state.mouseLocation))}</span>
        </div>
        <div
          key="map"
          style={{flex: 1}}
          className={`data-map data-map--${this.state.mode !== 'none' ? 'editing' : 'not-editing'}`}
        >
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
