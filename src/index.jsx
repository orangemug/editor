import React from 'react';
import ReactDOM from 'react-dom';

import './favicon.ico'
import './styles/index.scss'
import App from './components/App';
import Flags from './components/Flags';

import querystring from 'querystring';
import url from 'url';


const urlObj = url.parse(window.location.href);
var qsObj = querystring.parse(urlObj.query);


if(qsObj.access_token) {
  window.localStorage.setItem("github_access_token", qsObj.access_token);

  // TODO: Just remove the access_token
  console.warn("Clearing querystring");
  window.location.search = "";
}


const hash = document.location.hash.slice(1)

if(hash === "flags") {
  ReactDOM.render(<Flags/>, document.querySelector("#app"));
}
else {
  ReactDOM.render(<App/>, document.querySelector("#app"));
}
