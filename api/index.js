import React from "react";
import ReactDOM from "react-dom";

import './index.scss';
import './public/themes/ant-design.scss';
import './public/themes/light.scss';

import qsRouter from './qsRouter';
import Simple from './pages/Simple';
import Root from './pages/Root';
import Complex from './pages/Complex';


const {Router} = qsRouter({
  root: Root,
  simple: Simple,
});

ReactDOM.render(
  <Router />,
  document.querySelector("#app")
);

