import {ApiStyleStore} from '../libs/apistore';
import {useEffect} from 'react';


export default function useWebsocket ({mapStyle, setMapStyle}) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search.substring(1));
    let port = params.get("localport");
    if (port == null && (window.location.port != 80 && window.location.port != 443)) {
      port = window.location.port;
    }

    const styleStore = new ApiStyleStore({
      onLocalStyleChange: setMapStyle,
      // onLocalStyleChange: mapStyle => setMapStyle(mapStyle, {save: false}),
      port: port,
      host: params.get("localhost")
    });
  }, []);
}

