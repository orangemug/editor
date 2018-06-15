import React from 'react'
import mapboxGlToBlob from "mapbox-gl-to-blob";
import VirtualScreen from "./VirtualScreen";
import MapboxGlMap from './map/MapboxGlMap'
import InputBlock from './inputs/InputBlock'
import StringInput from './inputs/StringInput'
import NumberInput from './inputs/NumberInput'
import SelectInput from './inputs/SelectInput'
import LayerEditorGroup from './layers/LayerEditorGroup'
import Button from './Button'
import style from '../libs/style.js'
import Modal from './modals/Modal'


import { StyleStore } from '../libs/stylestore'


function saveBlob(blob, filename) {
  var el = document.createElement("a")
  el.href = URL.createObjectURL(blob);
  el.download = filename;
  el.click();
}


export default class Export extends React.Component {

  onStyleChanged(newStyle) {
    // HACK: Sometimes this is before the component is created.
    setTimeout(() => {
      this.setState({
        style: style.replaceAccessToken(newStyle, {allowFallback: true})
      })
    }, 0)
  }

  constructor(props) {
    super(props);

    this.styleStore = new StyleStore();
    this.styleStore.latestStyle(mapStyle => this.onStyleChanged(mapStyle))

    this.state = {
      isOpen: {
        exporting: false
      },
      width: 100,
      height: 100,
      unit: "mm",
      style: null,
      dpi: 300,
      format: "png",
      longitude: 0,
      latitude: 0,
      pitch: 0,
      zoom: 0,
      bearing: 0,
    }
  }

  export() {
    const opts = {
      // See <https://www.mapbox.com/mapbox-gl-js/api/#map> for usage
      mapboxGl: {
        // Required arguments
        style: this.state.style,
        // Optional arguments (showing defaults)
        pitch: this.state.pitch,
        zoom: this.state.zoom,
        center: {
          lat: this.state.latitude,
          lng: this.state.longitude,
        },
        bearing: this.state.bearing,
      },
      output: {
        dpi: this.state.dpi,
        dimensions: {
          unit: this.state.unit,
          width: this.state.width,
          height: this.state.height,
        }
      }
    }

    this.showLoadingModal();

    const format = this.state.format;
    this.cancelExport();

    const exportPromise = mapboxGlToBlob
      .toBlob(opts, "image/"+format)

    exportPromise
      .then((blob) => {
        saveBlob(blob, "map."+format);
        this.hideLoadingModal();
      })
      .catch((err) => {
        if(exportPromise.isCanceled) {
          return;
        }
        throw err;
      })

    this.setState({
      exportPromise: exportPromise
    });
  }

  cancelExport() {
    if(this.state.exportPromise && this.state.exportPromise.cancel) {
      this.state.exportPromise.cancel();
    }
  }

  cancelAndClose() {
    this.cancelExport();
    this.hideLoadingModal();
  }

  hideLoadingModal() {
    this.setState({
      isOpen: {
        exporting: false
      }
    })
  }

  showLoadingModal() {
    this.setState({
      isOpen: {
        exporting: true
      }
    })
  }

  onChange(key, value) {
    this.setState({
      [key]: value
    })
  }

  render() {
    const mapProps = {
      mapStyle: this.state.style,
      pitch: this.state.pitch,
      center: {
        lng: this.state.longitude,
        lat: this.state.latitude
      },
      zoom: this.state.zoom,
      bearing: this.state.bearing
    }

    const width  = mapboxGlToBlob.toPixels(this.state.width,  this.state.unit).replace("px", "");
    const height = mapboxGlToBlob.toPixels(this.state.height, this.state.unit).replace("px", "");

    return (
      <div className="maputnik-export">
        <div className="maputnik-export__settings">
          <header style={{padding: "5px"}}>
            <h1>Export</h1>
            <p>Render a raster version of your style</p>
          </header>

          <LayerEditorGroup
            title={"Export settings"}
          >
            <div>
              <InputBlock label={"Width (mm)"} doc={""}>
                <NumberInput
                  data-wd-key="export.width" 
                  value={this.state.width}
                  onChange={(v) => this.onChange("width", v)}
                />
              </InputBlock>

              <InputBlock label={"Height (mm)"} doc={""}>
                <NumberInput
                  data-wd-key="export.height" 
                  value={this.state.height}
                  onChange={(v) => this.onChange("height", v)}
                />
              </InputBlock>

              <InputBlock label={"DPI"} doc={""}>
                <NumberInput
                  data-wd-key="export.dpi" 
                  value={this.state.dpi}
                  onChange={(v) => this.onChange("dpi", v)}
                />
              </InputBlock>

              <InputBlock label={"Format"} doc={""}>
                <SelectInput
                  data-wd-key="export.format" 
                  options={[
                    ['png', 'PNG'],
                    ['jpeg', 'JPEG']
                  ]}
                  value={this.state.format}
                  onChange={(v) => this.onChange("format", v)}
                />

              </InputBlock>
            </div>
          </LayerEditorGroup>

          <LayerEditorGroup
            title={"Map"}
          >
            <div>
              <InputBlock label={"Latitude"} doc={""}>
                <NumberInput
                  data-wd-key="export.latitude" 
                  value={this.state.latitude}
                  onChange={(v) => this.onChange("latitude", v)}
                />
              </InputBlock>

              <InputBlock label={"Longitude"} doc={""}>
                <NumberInput
                  data-wd-key="export.longitude" 
                  value={this.state.longitude}
                  onChange={(v) => this.onChange("longitude", v)}
                />
              </InputBlock>

              <InputBlock label={"Pitch"} doc={""}>
                <NumberInput
                  data-wd-key="export.pitch" 
                  value={this.state.pitch}
                  onChange={(v) => this.onChange("pitch", v)}
                />
              </InputBlock>

              <InputBlock label={"Zoom"} doc={""}>
                <NumberInput
                  data-wd-key="export.zoom" 
                  value={this.state.zoom}
                  onChange={(v) => this.onChange("zoom", v)}
                />
              </InputBlock>

              <InputBlock label={"Bearing"} doc={""}>
                <NumberInput
                  data-wd-key="export.bearing" 
                  value={this.state.bearing}
                  onChange={(v) => this.onChange("bearing", v)}
                />
              </InputBlock>
            </div>
          </LayerEditorGroup>

          <div className="maputnik-input-block">
            <Button
              onClick={() => this.export()}
            >
              Export
            </Button>
          </div>
        </div>

        <div className="maputnik-export__preview">
          <VirtualScreen width={width} height={height}>
            <div style={{background: "blue", width: "100%", height: "100%"}}>
              <MapboxGlMap
                // HACK: Causes map pane to re-initialize
                key={this.state.width+"x"+this.state.height}
                {...mapProps}
                onMoveEnd={(newState) => this.onUpdate(newState)}
                onZoomEnd={(newState) => this.onUpdate(newState)}
                onPitchEnd={(newState) => this.onUpdate(newState)}
                onRotateEnd={(newState) => this.onUpdate(newState)}
                mapStyle={this.state.style}
              />
            </div>
          </VirtualScreen>
        </div>

        <Modal
          isOpen={this.state.isOpen.exporting}
          title="Exporting style"
          closable={false}
        >
          <p>
            Exporting style...
          </p>
          <Button
            onClick={() => this.cancelAndClose()}
          >
            Cancel
          </Button>
        </Modal>
      </div>
    )
  }

  onUpdate(newState) {
    this.setState(newState);
  }

}
