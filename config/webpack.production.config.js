var webpack = require('webpack');
var path = require('path');
var rules = require('./webpack.rules');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackInlineSVGPlugin = require('html-webpack-inline-svg-plugin');
var WebpackCleanupPlugin = require('webpack-cleanup-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var CopyWebpackPlugin = require('copy-webpack-plugin');
var artifacts = require("../test/artifacts");
var MiniCssExtractPlugin = require("mini-css-extract-plugin");
var OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var TerserJSPlugin = require('terser-webpack-plugin');

var env = 'production';
var OUTPATH = artifacts.pathSync(`/${env}/build`);
var NPM_OUTPATH = artifacts.pathSync(`/${env}/npm`);
var dependencies = Object.keys(require("../package.json").dependencies).map(dep => {
  return [dep, new RegExp("^"+dep+"\\/.+$")];
}).flat();

const base = {
  mode: env,
  target: 'web',
  resolve: {
    extensions: ['.js', '.jsx']
  },
  optimization: {
    usedExports: true,
    providedExports: true,
    minimizer: [
      new TerserJSPlugin({}),
      // Required for using 'mini-css-extract-plugin'
      new OptimizeCSSAssetsPlugin({}),
    ],
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
}

module.exports = [
  {
    ...base,
    entry: {
      core: [
        `./src/maputnik.jsx` // Your appʼs entry point
      ],
      "api/index": [
        `./api/index.js` // Your appʼs entry point
      ],
    },
    output: {
      path: OUTPATH,
      filename: '[name].[contenthash].js',
      chunkFilename: '[contenthash].js'
    },
    plugins: [
      new WebpackCleanupPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"'
        }
      }),
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
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        defaultSizes: 'gzip',
        openAnalyzer: false,
        generateStatsFile: true,
        reportFilename: 'bundle-stats.html',
        statsFilename: 'bundle-stats.json',
      }),
    ]
  },
  {
    ...base,
    externals: dependencies,
    entry: [
      `./src/index.jsx`,
    ],
    output: {
      path: NPM_OUTPATH,
      filename: 'index.js',
      library: 'maputnik',
      libraryTarget: 'commonjs2',
    },
    plugins: [
      new WebpackCleanupPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
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
          NODE_ENV: '"production"'
        }
      }),
      new MiniCssExtractPlugin({
        filename: 'index.css',
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        defaultSizes: 'gzip',
        openAnalyzer: false,
        generateStatsFile: true,
        reportFilename: 'bundle-stats.html',
        statsFilename: 'bundle-stats.json',
      }),
    ]
  },
];
