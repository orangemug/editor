import {useEffect} from 'react';
import Debug from '../libs/debug'


export default function useDebug ({mapStyle, revisionStack}) {
  useEffect(() => {
    if(Debug.enabled()) {
      Debug.set("maputnik", "mapStyle", mapStyle);
    }
  }, [mapStyle]);

  useEffect(() => {
    if(Debug.enabled()) {
      Debug.set("maputnik", "revisions", revisionStack);
    }
  }, [revisionStack]);
}

