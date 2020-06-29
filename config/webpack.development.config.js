var webpackConfigDef = require("./webpack.config.definition");
var config = webpackConfigDef("development");

module.exports = [
  config.editor,
];
