import React from 'react';
import ReactDOM from 'react-dom';

import './favicon.ico'
import './styles/index.scss'
import App from './components/App';
import New from './components/New';
import Flags from './components/Flags';

import OpenModal from './components/modals/OpenModal'

import { loadDefaultStyle, StyleStore } from './libs/stylestore'



import uuidv4 from 'uuid/v4';
import isorouter from 'isorouter';

var router = isorouter({
  inject: true // Add event listeners to window which trigger navigation such as tags and forms
});

router.get("/editor/styles", function (req, res) {
  ReactDOM.render(<New/>, document.querySelector("#app"));
})

router.get("/editor/flags", function (req, res) {
  ReactDOM.render(<Flags/>, document.querySelector("#app"));
});

const store = (new StyleStore);

router.get("/editor/styles/new", function (req, res) {
  const onOpenToggle = () => {
    console.log("onOpenToggle", arguments);
  };
  const onStyleOpen = function(mapStyle) {
    const id = Date.now()+"-"+uuidv4();
    mapStyle.id = id;
    store.save(mapStyle);
    router.go("/editor/styles/"+id);
  }


  ReactDOM.render(<OpenModal
    onOpenToggle={onOpenToggle}
    onStyleOpen={onStyleOpen}
    isOpen={true}
    />, document.querySelector("#app"));
})


router.get("/editor/styles/:styleId", function (req, res) {
  const styleId = req.params.styleId;
  let styleJSON = store.fetch(styleId);
  const styleJSONFormatted = JSON.stringify(styleJSON, null, 2);

  ReactDOM.render(<App styleId={styleId}/>, document.querySelector("#app"));
})

router.get("/editor/tmp", function (req, res) {
  ReactDOM.render(<App/>, document.querySelector("#app"));
})

router.go(window.location.pathname);
