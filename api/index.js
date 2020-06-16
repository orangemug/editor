import React from "react";
import ReactDOM from "react-dom";

import qsRouter from './qsRouter';
import Simple from './pages/Simple';
import Root from './pages/Root';
import Complex from './pages/Complex';


const {Router} = qsRouter({
  root: Root,
  simple: Simple,
  complex: Complex,
});

ReactDOM.render(
  <Router />,
  document.querySelector("#app")
);

