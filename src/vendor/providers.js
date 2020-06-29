function nonEnumerable (that, key, value) {
  Object.defineProperty(that, key, {
    value,
    enumerable: false,
  });
}

function getToken (url, apiKey) {
  let token = url.searchParams.get(apiKey);
  if (token && !token.match(/^\{.*\}$/)) {
    return token;
  }
}

class ApiKeyProvider {
  constructor (url, opts={}) {
    this.provider = opts.provider;
    this.path = opts.path;
    this.provider = opts.provider;
    this.token = getToken(url, opts.apiKey)
    nonEnumerable(this, "url", url);
    nonEnumerable(this, "apiKey", opts.apiKey);
  }

  injectToken (newToken, force) {
    if (this.token && !force) {
      return this.url.toString();
    }
    else {
      const url = new URL(this.url);
      url.searchParams.set(this.apiKey, newToken)
      return url.toString();
    }
  }
}



function get (o, path) {
  path = [...path];
  while(path.length > 0 && o.hasOwnProperty(path[0])) {
    o = o[path.shift()]
  }
  return o;
}

function urlAt (o, path) {
  try {
    return new URL(get(o, path));
  }
  catch(err) {
    return;
  }
}

function removeTokenPlaceholders ({provider, hostname, path}) {
}

const providerRules = [
  {
    id: 'maptiler',
    fn: (style, path, provider) => {
      const url = urlAt(style, path);
      if (url && url.hostname === "api.maptiler.com") {
        return new ApiKeyProvider(url, {apiKey: "key", path, provider});
      }
    }
  },
  {
    id: 'thunderforest',
    fn: (style, path, provider) => {
      const url = urlAt(style, path);
      if (url && url.hostname === "tile.thunderforest.com") {
        return new ApiKeyProvider(url, {apiKey: "apikey", path, provider});
      }
    }
  },
];

const available = providerRules.map(p => p.id);

function appendResponseObject (out, style, path, providers) {
  let provider;
  for (let p of providers) {
    provider = p.fn(style, path, p.id)
    if (provider) {
      break;
    }
  }
  if (provider) {
    out.push(provider);
  }
}

function query (style) {
  const out = [];

  appendResponseObject(out, style, ["glyphs"], providerRules);
  appendResponseObject(out, style, ["sprite"], providerRules);

  Object.entries(style.sources).forEach(([k,v]) => {
    const urlKey = (v.type === "geojson") ? "data" : "url";
    const path = ["sources", k, urlKey];
    appendResponseObject(out, style, path, providerRules)
  });

  return out;
}

function injectSource (style, item, tokens, force) {
  const key = item.path[1];
  const urlKey = item.path[2];
  const source = style.sources[key];
  return {
    ...style,
    sources: {
      ...style.sources,
      [key]: {
        ...source,
        [urlKey]: item.injectToken(tokens[item.provider], force),
      }
    }
  }
}

function injectRoot (style, item, tokens, force) {
  const key = item.path[0];
  return {
    ...style,
    [key]: item.injectToken(tokens[item.provider], force),
  };
}

function injectTokens (style, tokens, opts={}) {
  let newStyle = {...style};
  for (let item of query(style)) {
    const type = item.path[0];

    switch (type) {
      case "sources":
        newStyle = injectSource(newStyle, item, tokens, opts.force);
        break;
      case "glyphs":
      case "sprite":
        newStyle = injectRoot(newStyle, item, tokens, opts.force);
        break;
      default:
        console.warn(`Unknown type: "${type}"`);
        break;
    }
  }

  return newStyle;
}


module.exports = {
  available,
  injectTokens,
  query,
};
