"use strict";
var webpack = require('webpack');
var path = require('path');
var rules = require('./webpack.rules');
var artifacts = require("../test/artifacts");
var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackInlineSVGPlugin = require('html-webpack-inline-svg-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var MiniCssExtractPlugin = require("mini-css-extract-plugin");

var env = 'development';
var OUTPATH = artifacts.pathSync(`/${env}/build`);
var NPM_OUTPATH = artifacts.pathSync(`/${env}/npm`);

const HOST = process.env.HOST || "127.0.0.1";
const PORT = process.env.PORT || "8888";

const base = {
  target: 'web',
  mode: env,
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
      core: [
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
      path: OUTPATH,
      filename: '[name].js'
    },
    plugins: [
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.HotModuleReplacementPlugin(),
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
      path: NPM_OUTPATH,
      filename: 'index.js',
      library: 'maputnik',
      libraryTarget: 'commonjs2',
    },
    plugins: [
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new HtmlWebpackInlineSVGPlugin({
        runPreEmit: true,
      }),
      new CopyWebpackPlugin([
        {
          from: './package.json',
          to: 'package.json'
        },
      ]),
      new MiniCssExtractPlugin({
        filename: 'index.css',
      }),
    ]
  },
];
