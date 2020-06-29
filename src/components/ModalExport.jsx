import React from 'react'
import PropTypes from 'prop-types'
import Slugify from 'slugify'
import { saveAs } from 'file-saver'

import {format} from '@mapbox/mapbox-gl-style-spec'
import FieldString from './FieldString'
import FieldCheckbox from './FieldCheckbox'
import InputButton from './InputButton'
import Modal from './Modal'
import {MdFileDownload} from 'react-icons/md'
import style from '../libs/style'
import fieldSpecAdditional from '../libs/field-spec-additional'
import * as providers from '../vendor/providers';


export default class ModalExport extends React.Component {
  static propTypes = {
    mapStyle: PropTypes.object.isRequired,
    onStyleChanged: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    onOpenToggle: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
  }

  downloadStyle() {
    const tokenStyle = format(
      style.stripAccessTokens(
        style.replaceAccessTokens(this.props.mapStyle)
      )
    );

    const blob = new Blob([tokenStyle], {type: "application/json;charset=utf-8"});
    let exportName;
    if(this.props.mapStyle.name) {
      exportName = Slugify(this.props.mapStyle.name, {
                     replacement: '_',
                     lower: true
                   })
    } else {
      exportName = this.props.mapStyle.id
    }
    saveAs(blob, exportName + ".json");
  }

  changeMetadataProperty(property, value) {
    const changedStyle = {
      ...this.props.mapStyle,
      metadata: {
        ...this.props.mapStyle.metadata,
        [property]: value
      }
    }
    this.props.onStyleChanged(changedStyle)
  }


  render() {
    const {mapStyle} = this.props;

    const providerApiComponents = {
      "maptiler": ({key}) => (
        <FieldString
          key={key}
          label={fieldSpecAdditional.maputnik.maptiler_access_token.label}
          fieldSpec={fieldSpecAdditional.maputnik.maptiler_access_token}
          value={(this.props.mapStyle.metadata || {})['maputnik:openmaptiles_access_token']}
          onChange={this.changeMetadataProperty.bind(this, "maputnik:openmaptiles_access_token")}
        />
      ),
      "thunderforest": ({key}) => (
        <FieldString
          key={key}
          label={fieldSpecAdditional.maputnik.thunderforest_access_token.label}
          fieldSpec={fieldSpecAdditional.maputnik.thunderforest_access_token}
          value={(this.props.mapStyle.metadata || {})['maputnik:thunderforest_access_token']}
          onChange={this.changeMetadataProperty.bind(this, "maputnik:thunderforest_access_token")}
        />
      ),
    }

    const providerList = Array.from(new Set(
      providers.query(mapStyle).map(p => p.provider)
    ));

    return <Modal
      data-wd-key="modal:export"
      isOpen={this.props.isOpen}
      onOpenToggle={this.props.onOpenToggle}
      title={'Export Style'}
      className="maputnik-export-modal"
    >

      <section className="maputnik-modal-section">
        <h1>Download Style</h1>
        <p>
          Download a JSON style to your computer.
        </p>

        <div>
          {providerList.map(providerId => {
            return providerApiComponents[providerId]({
              key: providerId,
            });
          })}
        </div>

        <InputButton
          onClick={this.downloadStyle.bind(this)}
          title="Download style"
        >
          <MdFileDownload />
          Download
        </InputButton>
      </section>

    </Modal>
  }
}

