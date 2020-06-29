import {useEffect} from 'react';
import {StyleStore} from '../libs/stylestore';


export default function useStore({mapStyle, setMapStyle}) {
  const stylestore = new StyleStore();

  useEffect(() => {
    stylestore.latestStyle(setMapStyle);
  }, []);

  useEffect(() => {
    stylestore.save(mapStyle)
  }, [mapStyle]);
}
