var webpack          = require("webpack");
var WebpackDevServer = require("webpack-dev-server");
var testConfig       = require("../test/config/specs");
var artifacts        = require("../test/artifacts");
var isDocker         = require("is-docker");
var webpackConfigDef = require("./webpack.config.definition");
var webpackConfig = webpackConfigDef("development");


var server;
var env = "test";
var SCREENSHOT_PATH = artifacts.pathSync(`/${env}/screenshots`);

exports.config = {
  runner: 'local',
  path: '/wd/hub',
  specs: [
    './test/functional/index.js'
  ],
  maxInstances: 10,
  capabilities: [
    {
      maxInstances: 5,
      browserName: (process.env.BROWSER || 'chrome'),
    }
  ],
  logLevel: 'info',
  bail: 0,
  screenshotPath: SCREENSHOT_PATH,
  hostname: process.env.DOCKER_HOST || "0.0.0.0",
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    // Because we don't know how long the initial build will take...
    timeout: 4*60*1000,
  },
  onPrepare: function (config, capabilities) {
    return new Promise(function(resolve, reject) {
      var compiler = webpack(
        webpackConfig.editor,
      );
      const serverHost = "0.0.0.0";

      server = new WebpackDevServer(compiler, {
        host: serverHost,
        disableHostCheck: true,
        stats: {
          colors: true
        }
      });

      server.listen(testConfig.port, serverHost, function(err) {
        if(err) {
          reject(err);
        }
        else {
          resolve();
        }
      });
    })
  },
  onComplete: function(exitCode) {
    return new Promise(function(resolve, reject) {
      server.close(function (err) {
        if (err) {
          reject(err)
        }
        else {
          resolve();
        }
      })
    });
  }
}
