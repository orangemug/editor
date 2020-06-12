import React from 'react'
import PropTypes from 'prop-types'

import {latest} from '@mapbox/mapbox-gl-style-spec'
import Block from './Block'
import InputSelect from './InputSelect'
import InputString from './InputString'


const TYPE_OPTIONS = [
  ['background', 'Background'],
  ['fill', 'Fill'],
  ['line', 'Line'],
  ['symbol', 'Symbol'],
  ['raster', 'Raster'],
  ['circle', 'Circle'],
  ['fill-extrusion', 'Fill Extrusion'],
  ['hillshade', 'Hillshade'],
  ['heatmap', 'Heatmap'],
];

export default class FieldType extends React.Component {
  static propTypes = {
    value: PropTypes.string.isRequired,
    wdKey: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    error: PropTypes.object,
    disabled: PropTypes.bool,
  }

  static defaultProps = {
    disabled: false,
  }

  render() {
    const {allowList} = this.props;
    let typeOptions;
    if (allowList) {
      typeOptions = TYPE_OPTIONS.filter(([key, label]) => {
        return allowList.includes(key);
      });
    }
    else {
      typeOptions = TYPE_OPTIONS;
    }

    return <Block label={"Type"} fieldSpec={latest.layer.type}
      data-wd-key={this.props.wdKey}
      error={this.props.error}
    >
      {this.props.disabled &&
        <InputString
          value={this.props.value}
          disabled={true}
        />
      }
      {!this.props.disabled &&
        <InputSelect
          options={typeOptions}
          onChange={this.props.onChange}
          value={this.props.value}
        />
      }
    </Block>
  }
}
