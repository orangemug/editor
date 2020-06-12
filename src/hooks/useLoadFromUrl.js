import {useEffect} from 'react';

export default function useLoadFromUrl ({styleStore, setMapStyle}) {
  return () => {
    const styleUrl = initialStyleUrl()
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
  }
}


