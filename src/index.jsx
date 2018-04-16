import React from 'react';
import ReactDOM from 'react-dom';

import './favicon.ico'
import './styles/index.scss'
import App from './components/App';
import Export from './components/Export';

const appEl = document.querySelector("#app")

// HACK: Yeah we need to put in a real router :)
// This will to for testing though
if(window.location.search.match(/[?]exporter/)) {
  ReactDOM.render(<Export/>, appEl);
}
else {
  ReactDOM.render(<App/>, appEl);
}
