const artifacts = require("../test/artifacts");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackInlineSVGPlugin = require('html-webpack-inline-svg-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const path = require('path');
const pkgJson = require("../package.json")
const rules = require('./webpack.rules');
const TerserJSPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const WebpackCleanupPlugin = require('webpack-cleanup-plugin');


function purge (arr) {
  return arr.filter(item => !(item === undefined || item === null));
}

function rit (cond, val) {
  if (cond) {
    return val;
  }
}

function getPkgDeps () {
  return Object.keys(pkgJson.dependencies)
  .map(dep => {
    return [dep, new RegExp("^"+dep+"\\/.+$")];
  })
  // polyfill for .flat() see <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat>
  .reduce((acc, val) => acc.concat(val), []);
}

module.exports = (env) => {
  const devServerHost = process.env.HOST || "127.0.0.1";
  const devServerPort = process.env.PORT || "8888";
  const devTool = process.env.WEBPACK_DEVTOOL || 'cheap-module-source-map';

  var buildOutputPath = artifacts.pathSync(`/${env}/build`);
  var npmOutputPath = artifacts.pathSync(`/${env}/npm`);
  var dependencies = getPkgDeps();

  const isProduction = env === "production";
  const isProfiling = env === "profiling";

  const hasDevserver = !(isProduction || isProfiling);
  const hasHmr = hasDevserver;

  let base = {
    mode: (
      (isProduction || isProfiling)
      ? "production"
      : "development"
    ),
    target: 'web',
    devtool: devTool,
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        ...(
          isProfiling
          ? {
            'react-dom$': 'react-dom/profiling',
            'scheduler/tracing': 'scheduler/tracing-profiling',
          }
          : {}
        ),
      }
    },
    module: {
      noParse: [
        /mapbox-gl\/dist\/mapbox-gl.js/
      ],
      rules: rules(),
    },
    node: {
      fs: "empty",
      net: 'empty',
      tls: 'empty'
    }
  };

  if (hasDevserver) {
    base.devServer = {
      contentBase: "./public",
      // do not print bundle build stats
      noInfo: true,
      // enable HMR
      hot: true,
      // embed the webpack-dev-server runtime into the bundle
      inline: true,
      port: devServerPort,
      host: devServerHost,
      watchOptions: {
        // Disabled polling by default as it causes lots of CPU usage and hence drains laptop batteries. To enable polling add WEBPACK_DEV_SERVER_POLLING to your environment
        // See <https://webpack.js.org/configuration/watch/#watchoptions-poll> for details
        poll: (!!process.env.WEBPACK_DEV_SERVER_POLLING ? true : false),
        watch: false
      }
    };
  }

  if (isProduction || isProfiling) {
    base.optimization = {
      usedExports: true,
      providedExports: true,
      minimizer: [
        new TerserJSPlugin({}),
        // Required for using 'mini-css-extract-plugin'
        new OptimizeCSSAssetsPlugin({}),
      ],
    };
  }

  const editor = {
    ...base,
    entry: {
      core: purge([
        rit(hasHmr, `webpack-dev-server/client?http://${devServerHost}:${devServerPort}`),
        rit(hasHmr, `webpack/hot/only-dev-server`),
        `./src/maputnik.jsx` // Your appʼs entry point
      ]),
      "api/index": purge([
        rit(hasHmr, `webpack-dev-server/client?http://${devServerHost}:${devServerPort}`),
        rit(hasHmr, `webpack/hot/only-dev-server`),
        `./api/index.js` // Your appʼs entry point
      ]),
    },
    output: {
      path: buildOutputPath,
      filename: '[name].js',
      chunkFilename: '[contenthash].js'
    },
    plugins: purge([
      rit(isProduction || isProfiling, new WebpackCleanupPlugin()),
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: `"${env}"`
        }
      }),
      rit(hasHmr, new webpack.HotModuleReplacementPlugin()),
      new HtmlWebpackPlugin({
        template: './api/index.html',
        filename: 'api/index.html',
        inject: false,
      }),
      new HtmlWebpackPlugin({
        title: 'Maputnik',
        template: './src/template.html',
        filename: 'index.html',
        inject: false,
      }),
      new HtmlWebpackInlineSVGPlugin({
        runPreEmit: true,
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
      }),
      new CopyWebpackPlugin([
        {
          from: './src/manifest.json',
          to: 'manifest.json'
        },
      ]),
      rit(isProduction,
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          defaultSizes: 'gzip',
          openAnalyzer: false,
          generateStatsFile: true,
          reportFilename: 'bundle-stats.html',
          statsFilename: 'bundle-stats.json',
        })
      ),
    ]),
  };

  const pkg = {
    ...base,
    externals: dependencies,
    entry: purge([
      rit(hasHmr, `webpack-dev-server/client?http://${devServerHost}:${devServerPort}`),
      rit(hasHmr, `webpack/hot/only-dev-server`),
      `./src/index.jsx`,
    ]),
    output: {
      path: npmOutputPath,
      filename: 'index.js',
      library: 'maputnik',
      libraryTarget: 'commonjs2',
    },
    plugins: purge([
      rit(isProduction || isProfiling, new WebpackCleanupPlugin()),
      new webpack.NoEmitOnErrorsPlugin(),
      rit(hasHmr, new webpack.HotModuleReplacementPlugin()),
      new HtmlWebpackInlineSVGPlugin({
        runPreEmit: true,
      }),
      new CopyWebpackPlugin([
        {
          from: './package.json',
          to: 'package.json'
        },
      ]),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: `"${env}"`
        }
      }),
      new MiniCssExtractPlugin({
        filename: 'index.css',
      }),
      rit(isProduction,
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          defaultSizes: 'gzip',
          openAnalyzer: false,
          generateStatsFile: true,
          reportFilename: 'bundle-stats.html',
          statsFilename: 'bundle-stats.json',
        })
      ),
    ]),
  };

  return {
    editor,
    pkg,
  };
};
