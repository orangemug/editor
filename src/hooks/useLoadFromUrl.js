import {useEffect} from 'react';
import {initialStyleUrl, loadStyleUrl, removeStyleQuerystring} from '../libs/urlopen'


export default function useLoadFromUrl ({setMapStyle}) {
  useEffect(() => {
    let canceled = false;
    const styleUrl = initialStyleUrl();

    if(styleUrl) {
      removeStyleQuerystring()

      if (window.confirm("Load style from URL: " + styleUrl + " and discard current changes?")) {
        // TODO: Set state loading

        loadStyleUrl(styleUrl, mapStyle => {
          if (!canceled) {
            setMapStyle(mapStyle);
          }
        })
      }
    }

    return () => {
      canceled = true;
    };
  }, []);
}


