import {useEffect} from 'react';
import {getStyle, setStyle} from '../libs/stylestore';


export default function useWebsocketApi({setMapStyle}) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search.substring(1));
    let port = params.get("localport");
    if (port == null && (window.location.port != 80 && window.location.port != 443)) {
      port = window.location.port;
    }

    const apiStore = new ApiStyleStore({
      port: port,
      host: params.get("localhost"),
    });

    apiStore.watch(setMapStyle);

    return () => {
      apiStore.destroy();
    };
  }, [setMapStyle]);
}
