import {useEffect} from 'react';
import {StyleStore} from '../libs/stylestore'
import {initialStyleUrl, loadStyleUrl, removeStyleQuerystring} from '../libs/urlopen'


export default function useLoadFromUrl ({styleStore, setMapStyle}) {
  useEffect(() => {
    const styleUrl = initialStyleUrl();
    let styleStore;

    if(styleUrl && window.confirm("Load style from URL: " + styleUrl + " and discard current changes?")) {
      styleStore = new StyleStore()
      loadStyleUrl(styleUrl, mapStyle => setMapStyle(mapStyle))
      removeStyleQuerystring()
    } else {
      if(styleUrl) {
        removeStyleQuerystring()
      }
      styleStore.init(err => {
        if(err) {
          console.log('Falling back to local storage for storing styles')
          styleStore = new StyleStore()
        }
        styleStore.latestStyle(mapStyle => setMapStyle(mapStyle, {
          initialLoad: true
        }))
      })
    }

    return () => {
      styleStore.destroy();
    };
  }, []);
}


