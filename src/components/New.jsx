import React from 'react'

import style from '../libs/style.js'
import { loadDefaultStyle, StyleStore } from '../libs/stylestore'
import MapboxGlMap from './map/MapboxGlMap'




console.log("StyleStore", StyleStore);

const styleStore = new StyleStore;

const styles = styleStore.mapStyles.map((id) => {
  return {id: id, name: id}
})


export default class New extends React.Component {
  constructor(props) {
    super(props)
  }

  newStyle() {
    const id = styleStore.newStyle();
    history.pushState({}, "", "/editor/styles/"+id);
  }

  // TODO: From App.jsx
  mapRenderer(mapStyle) {
    const mapProps = {
      mapStyle: style.replaceAccessToken(mapStyle)
    }

    const metadata = mapStyle.metadata || {}
    const renderer = metadata['maputnik:renderer'] || 'mbgljs'

    return <MapboxGlMap {...mapProps} />
  }

  render() {
    return <div>
      <h1>Cached styles</h1>
      <p>Below are your cached styles.</p>
      <div className="view-styles">
        {styles.map((obj) => {
          return <div className="view-styles__style">
            <div className="view-styles__style__preview">
              {this.mapRenderer(styleStore.fetch(obj.id))}
            </div>
            <a href={"styles/"+obj.id}>{obj.name}</a>
            <a className="view-styles__style__anchor" href={"styles/"+obj.id}></a>
          </div>
        })}

        <div className="view-styles__style">
          <div className="view-styles__style__preview"></div>
          <a href="/editor/styles/new" className="js-new-style" nonClick={() => this.newStyle()}>Add new style</a>
          <a className="view-styles__style__anchor" href={"styles/new"}></a>
        </div>

        <div className="view-styles__style"></div>
        <div className="view-styles__style"></div>
        <div className="view-styles__style"></div>
        <div className="view-styles__style"></div>
        <div className="view-styles__style"></div>
        <div className="view-styles__style"></div>
        <div className="view-styles__style"></div>
        <div className="view-styles__style"></div>
      </div>
    </div>
  }
}
