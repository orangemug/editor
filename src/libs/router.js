import pathToRegexp from 'path-to-regexp';


export default function router(routes) {
  const mappedRoutes = routes
    .map(function(route) {
      let keys = [];
      const re = pathToRegexp(route.path, keys, {
        end: false
      });

      return {
        check: function(path) {
          let matches = re.exec(path);

          if(matches) {
            let out = {};
            let idx = 1;
            for(const [idx, val] of keys.entries()) {
              out[val] = matches[idx+1]
            }
            return out;
          }
        },
        handler: route.handler
      }
    })

  function doRouting() {
    const path = window.location.hash.slice(1);

    for(const route of mappedRoutes) {
      let parts = route.check(path);

      if(parts) {
        route.handler(parts);
        return;
      }
    }
  }

  window.addEventListener("hashchange", doRouting);
  doRouting();

  return {
    destroy: function() {
      window.removeEventListener("hashchange", doRouting);
    }
  }
}
