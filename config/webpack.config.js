"use strict";
var webpack = require('webpack');
var path = require('path');
var rules = require('./webpack.rules');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackInlineSVGPlugin = require('html-webpack-inline-svg-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

const HOST = process.env.HOST || "127.0.0.1";
const PORT = process.env.PORT || "8888";

const base = {
  target: 'web',
  mode: 'development',
  devtool: process.env.WEBPACK_DEVTOOL || 'cheap-module-source-map',
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    noParse: [
      /mapbox-gl\/dist\/mapbox-gl.js/
    ],
    rules: rules
  },
  node: {
    fs: "empty",
    net: 'empty',
    tls: 'empty'
  },
  devServer: {
    contentBase: "./public",
    // do not print bundle build stats
    noInfo: true,
    // enable HMR
    hot: true,
    // embed the webpack-dev-server runtime into the bundle
    inline: true,
    port: PORT,
    host: HOST,
    watchOptions: {
      // Disabled polling by default as it causes lots of CPU usage and hence drains laptop batteries. To enable polling add WEBPACK_DEV_SERVER_POLLING to your environment
      // See <https://webpack.js.org/configuration/watch/#watchoptions-poll> for details
      poll: (!!process.env.WEBPACK_DEV_SERVER_POLLING ? true : false),
      watch: false
    }
  },
}

module.exports = [
  {
    ...base,
    entry: {
      bundle: [
        `webpack-dev-server/client?http://${HOST}:${PORT}`,
        `webpack/hot/only-dev-server`,
        `./src/maputnik.jsx` // Your appʼs entry point
      ],
      "api/index": [
        `webpack-dev-server/client?http://${HOST}:${PORT}`,
        `webpack/hot/only-dev-server`,
        `./api/index.js` // Your appʼs entry point
      ],
    },
    output: {
      path: path.join(__dirname, '..', 'public'),
      filename: '[name].js'
    },
    plugins: [
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new HtmlWebpackPlugin({
        title: 'Maputnik',
        template: './src/template.html',
        inject: false,
      }),
      new HtmlWebpackInlineSVGPlugin({
        runPreEmit: true,
      }),
      new CopyWebpackPlugin([
        {
          from: './src/manifest.json',
          to: 'manifest.json'
        },
        {
          from: './api/index.html',
          to: 'api/index.html'
        },
      ])
    ]
  },
  {
    ...base,
    entry: [
      `webpack-dev-server/client?http://${HOST}:${PORT}`,
      `webpack/hot/only-dev-server`,
      `./src/index.jsx`,
    ],
    output: {
      path: path.join(__dirname, '..', 'public'),
      filename: 'module.js',
      library: 'maputnik',
      libraryTarget: 'umd',
    },
    plugins: [
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.HotModuleReplacementPlugin(),
    ]
  },
];
