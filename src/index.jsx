import { IconContext } from "react-icons";
import React from 'react';
import ReactDOM from 'react-dom';

import './favicon.ico'
import './styles/index.scss'
import App from './components/App';
import {Workbox} from 'workbox-window';

if ('serviceWorker' in navigator) {
  const wb = new Workbox('./service-worker.js');

  wb.addEventListener('waiting', (event) => {
    wb.addEventListener('controlling', (event) => {
      // Just force a reload if we have a new version.
      window.location.reload();
    });
    wb.messageSW({type: 'SKIP_WAITING'});
  });

  wb.register();
}

ReactDOM.render(
  <IconContext.Provider value={{className: 'react-icons'}}>
    <App/>
  </IconContext.Provider>,
  document.querySelector("#app")
);
