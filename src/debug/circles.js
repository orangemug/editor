const style = {
  "version": 8,
  "sources": {
    "test": {
      "type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": [
          {
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "coordinates": [0, -10]
            },
            "properties": {}
          }
        ]
      }
    }
  },
  "sprite": "",
  "glyphs": "https://orangemug.github.io/font-glyphs/glyphs/{fontstack}/{range}.pbf",
  "layers": [
    {
      "id": "test1",
      "type": "circle",
      "source": "test",
      "paint": {
        "circle-radius": 40,
        "circle-color": "red",
        "circle-translate": [-60, -60]
      }
    },
    {
      "id": "test2",
      "type": "circle",
      "source": "test",
      "paint": {
        "circle-radius": 40,
        "circle-color": "green",
        "circle-translate": [60, -60]
      }
    },
    {
      "id": "test3",
      "type": "circle",
      "source": "test",
      "paint": {
        "circle-radius": 40,
        "circle-color": "blue",
        "circle-translate": [60, 60]
      }
    },
    {
      "id": "test4",
      "type": "circle",
      "source": "test",
      "paint": {
        "circle-radius": 40,
        "circle-color": "yellow",
        "circle-translate": [-60, 60]
      }
    }
  ]
}

export default style;
