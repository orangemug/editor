import React from 'react'
import PropTypes from 'prop-types'

import * as styleSpec from '@mapbox/mapbox-gl-style-spec/style-spec'
import InputBlock from '../inputs/InputBlock'
import SelectInput from '../inputs/SelectInput'

class LayerTypeBlock extends React.Component {
  static propTypes = {
    value: PropTypes.string.isRequired,
    wdKey: PropTypes.string,
    onChange: PropTypes.func.isRequired,
  }

  render() {
    let options = [
      ['background', 'Background'],
      ['fill', 'Fill'],
      ['line', 'Line'],
      ['symbol', 'Symbol'],
      ['raster', 'Raster'],
      ['circle', 'Circle'],
      ['fill-extrusion', 'Fill Extrusion'],
      ['hillshade', 'Hillshade'],
      ['heatmap', 'Heatmap'],
    ]

    if(this.props.value === "invalid") {
      options.push(["invalid", "Invalid type"]);
    }
    else {
      // Type changes are way to complex so don't allow them, users can delete the layer instead.
      options = options.filter((option) => {
        return this.props.value === option[0];
      })
    }

    return <InputBlock label={"Type"} doc={styleSpec.latest.layer.type.doc}
      data-wd-key={this.props.wdKey}
    >
      <SelectInput
        options={options}
        onChange={this.props.onChange}
        value={this.props.value}
      />
    </InputBlock>
  }
}

export default LayerTypeBlock
