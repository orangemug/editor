const style = {
  "version": 8,
  "sources": {
    "test": {
      "type": "geojson",
      "data": "/editor/api/public/sources/simple.json"
    }
  },
  "sprite": "",
  "glyphs": "https://orangemug.github.io/font-glyphs/glyphs/{fontstack}/{range}.pbf",
  "layers": [
    {
      "id": "test0",
      "type": "circle",
      "source": "test",
      "filter": [
        "all",
        ["==", "id", "point_0"]
      ],
      "paint": {
        "circle-radius": 40,
        "circle-color": "red",
      }
    },
    {
      "id": "test1",
      "type": "circle",
      "source": "test",
      "filter": [
        "all",
        ["==", "id", "point_1"]
      ],
      "paint": {
        "circle-radius": 40,
        "circle-color": "green",
      }
    },
    {
      "id": "test2",
      "type": "circle",
      "source": "test",
      "filter": [
        "all",
        ["==", "id", "point_2"]
      ],
      "paint": {
        "circle-radius": 40,
        "circle-color": "blue",
      }
    },
    {
      "id": "test3",
      "type": "circle",
      "source": "test",
      "filter": [
        "all",
        ["==", "id", "point_3"]
      ],
      "paint": {
        "circle-radius": 40,
        "circle-color": "yellow",
      }
    }
  ]
}

export default style;
