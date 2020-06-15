import {useEffect, useState} from 'react';
import {isEqual} from 'lodash';


export default function useUndoStack ({mapStyle, setMapStyle}) {
  const [revisionStore, setRevisionStore] = useState({
    pointer: 0,
    revisions: [
      mapStyle,
    ],
  });
  const [ignore, setIgnore] = useState(null);

  useEffect(() => {
    const {revisions, pointer} = revisionStore;
    const newPointer = pointer + 1;

    setIgnore(null);
    if (ignore && ignore === mapStyle) {
      return;
    }

    const hasChanged = !isEqual(
      revisions[pointer],
      mapStyle
    );

    if (hasChanged) {
      setRevisionStore({
        pointer: newPointer,
        revisions: revisions.slice(0, newPointer).concat(mapStyle),
      });
    }
  }, [mapStyle]);

  function canUndo () {
    const {pointer} = revisionStore;
    return (pointer > 0);
  }

  function canRedo () {
    const {pointer, revisions} = revisionStore;
    return (pointer < revisions.length-1);
  }

  function onUndo () {
    if (canUndo()) {
      const {pointer, revisions} = revisionStore;
      const newPointer = pointer-1;
      setRevisionStore({
        ...revisionStore,
        pointer: newPointer,
      });

      const newStyle = revisions[newPointer];
      setIgnore(newStyle);
      setMapStyle(newStyle);
    }
  }

  function onRedo () {
    if (canRedo()) {
      const {pointer, revisions} = revisionStore;
      const newPointer = pointer+1;
      setRevisionStore({
        ...revisionStore,
        pointer: newPointer,
      });

      const newStyle = revisions[newPointer];
      setIgnore(newStyle);
      setMapStyle(newStyle);
    }
  }

  return {onUndo, onRedo, canUndo, canRedo};
}

