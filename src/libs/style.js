import deref from '@mapbox/mapbox-gl-style-spec/deref'
import tokens from '../config/tokens.json'

// Empty style is always used if no style could be restored or fetched
const emptyStyle = ensureStyleValidity({
  version: 8,
  sources: {},
  layers: [],
})

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

function ensureHasId(style) {
  if('id' in style) return style
  style.id = generateId()
  return style
}

function ensureHasNoInteractive(style) {
  const changedLayers = style.layers.map(layer => {
    const changedLayer = { ...layer }
    delete changedLayer.interactive
    return changedLayer
  })

  const nonInteractiveStyle = {
    ...style,
    layers: changedLayers
  }
  return nonInteractiveStyle
}

function ensureHasNoRefs(style) {
  const derefedStyle = {
    ...style,
    layers: deref(style.layers)
  }
  return derefedStyle
}

function ensureStyleValidity(style) {
  return ensureHasNoInteractive(ensureHasNoRefs(ensureHasId(style)))
}

function indexOfLayer(layers, layerId) {
  for (let i = 0; i < layers.length; i++) {
    if(layers[i].id === layerId) {
      return i
    }
  }
  return null
}

function getAccessToken(sourceName, mapStyle, opts) {
  if(sourceName === "thunderforest_transport" || sourceName === "thunderforest_outdoors") {
    sourceName = "thunderforest"
  }

  const metadata = mapStyle.metadata || {}
  let accessToken = metadata[`maputnik:${sourceName}_access_token`]

  if(opts.allowFallback && !accessToken) {
    accessToken = tokens[sourceName]
  }

  return accessToken;
}

function replaceSourceAccessToken(mapStyle, sourceName, opts={}) {
  const source = mapStyle.sources[sourceName]
  if(!source) return mapStyle
  if(!source.hasOwnProperty("url")) return mapStyle

  const accessToken = getAccessToken(sourceName, mapStyle, opts)

  if(!accessToken) {
    // Early exit.
    return mapStyle;
  }

  const changedSources = {
    ...mapStyle.sources,
    [sourceName]: {
      ...source,
      url: source.url.replace('{key}', accessToken)
    }
  }
  const changedStyle = {
    ...mapStyle,
    sources: changedSources
  }
  return changedStyle
}

function replaceAccessTokens(mapStyle, opts={}) {
  let changedStyle = mapStyle

  Object.keys(mapStyle.sources).forEach((sourceName) => {
    changedStyle = replaceSourceAccessToken(changedStyle, sourceName, opts);
  })

  if (mapStyle.glyphs && (mapStyle.glyphs.match(/\.tilehosting\.com/) || mapStyle.glyphs.match(/\.maptiler\.com/))) {
    const newAccessToken = getAccessToken("openmaptiles", mapStyle, opts);
    if (newAccessToken) {
      changedStyle = {
        ...changedStyle,
        glyphs: mapStyle.glyphs.replace('{key}', newAccessToken)
      }
    }
  }

  return changedStyle
}

function stripAccessTokens(mapStyle) {
  const changedMetadata = {
    ...mapStyle.metadata
  };
  delete changedMetadata['maputnik:mapbox_access_token'];
  delete changedMetadata['maputnik:openmaptiles_access_token'];
  return {
    ...mapStyle,
    metadata: changedMetadata
  };
}

function setDefaults (styleObj) {
  const metadata = styleObj.metadata || {}
  if(metadata['maputnik:renderer'] === undefined) {
    const changedStyle = {
      ...styleObj,
      metadata: {
        ...styleObj.metadata,
        'maputnik:renderer': 'mbgljs'
      }
    }
    return changedStyle
  } else {
    return styleObj
  }
}

function replaceAccessToken(url, mapStyle) {
  const matchesTilehosting = url.match(/\.tilehosting\.com/);
  const matchesMaptiler = url.match(/\.maptiler\.com/);
  const matchesThunderforest = url.match(/\.thunderforest\.com/);
  if (matchesTilehosting || matchesMaptiler) {
    const accessToken = getAccessToken("openmaptiles", mapStyle, {allowFallback: true})
    if (accessToken) {
      return url.replace('{key}', accessToken)
    }
  }
  else if (matchesThunderforest) {
    const accessToken = getAccessToken("thunderforest", mapStyle, {allowFallback: true})
    if (accessToken) {
      return url.replace('{key}', accessToken)
    }
  }
  else {
    return url;
  }
}

// Similar functionality as <https://github.com/mapbox/mapbox-gl-js/blob/7e30aadf5177486c2cfa14fe1790c60e217b5e56/src/util/mapbox.js>
function normalizeSourceURL (url, tokens) {
  const apiToken = tokens["mapbox"];
  const matches = url.match(/^mapbox:\/\/(.*)/);
  if (apiToken && matches) {
    // mapbox://mapbox.mapbox-streets-v7
    return `https://api.mapbox.com/v4/${matches[1]}.json?secure&access_token=${apiToken}`
  }
  else {
    return url;
  }
}

export default {
  ensureStyleValidity,
  emptyStyle,
  indexOfLayer,
  generateId,
  getAccessToken,
  replaceAccessTokens,
  stripAccessTokens,
  setDefaults,
  replaceAccessToken,
  normalizeSourceURL,
}
