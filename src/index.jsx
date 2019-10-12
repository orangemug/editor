import { IconContext } from "react-icons";
import React from 'react';
import ReactDOM from 'react-dom';

import './favicon.ico'
import './styles/index.scss'
import App from './components/App';

if ('serviceWorker' in navigator) {
  // Use the window load event to keep the page load performant
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js');
  });
}

ReactDOM.render(
  <IconContext.Provider value={{className: 'react-icons'}}>
    <App/>
  </IconContext.Provider>,
  document.querySelector("#app")
);
