var webpackConfigDef = require("./webpack.config.definition");
var config = webpackConfigDef("production");

module.exports = [
  config.editor,
  config.pkg,
];
