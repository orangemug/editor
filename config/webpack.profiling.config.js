var webpackConfigDef = require("./webpack.config.definition");
var config = webpackConfigDef("profiling");

module.exports = [
  config.editor,
  config.pkg,
];
