import React from 'react';
import ReactDOM from 'react-dom';

import './favicon.ico'
import './styles/index.scss'
import App from './components/App';
import Flags from './components/Flags';

import querystring from 'querystring';
import url from 'url';
import router from './libs/router';


const urlObj = url.parse(window.location.href);
let qsObj = querystring.parse(urlObj.query);


// HACK: To grab the access token
// NOTE: This is currently insecure as the token will be left in the users browser history.
if(qsObj.access_token) {
  window.localStorage.setItem("github_access_token", qsObj.access_token);

  console.debug("Remove access_token from querystring");

  delete qsObj["access_token"];
  const qsStr = querystring.stringify(qsObj);

  window.location.search = qsStr;
}


const targetElement = document.querySelector("#app");

router([
  {
    "path": "/flags",
    "handler": function() {
      ReactDOM.render(<Flags/>, targetElement);
    }
  },
  {
    "path": ":path*",
    "handler": function() {
      ReactDOM.render(<App/>, targetElement);
    }
  }
]);

