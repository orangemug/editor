import {useEffect} from 'react';
import Debug from '../libs/debug'


export default function useDebug ({mapStyle, revisionStack}) {
  useEffect(() => {
    if(Debug.enabled()) {
      Debug.set("maputnik", "styleStore", mapStyle);
    }
  }, [mapStyle]);

  useEffect(() => {
    if(Debug.enabled()) {
      Debug.set("maputnik", "revisionStore", revisionStack);
    }
  }, [revisionStack]);
}

