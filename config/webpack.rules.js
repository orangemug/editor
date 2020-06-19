const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = ({isStorybook}) => {
  return [
    {
      test: /\.md$/,
      use: 'raw-loader'
    },
    {
      test: /\.jsx?$/,
      exclude: [
        path.resolve(__dirname, '../node_modules')
      ],
      use: 'babel-loader'
    },
    {
      test: /\.(eot|ttf|woff|woff2)$/,
      use: 'file-loader?name=fonts/[name].[ext]'
    },
    {
      test: /\.ico$/,
      use: 'file-loader?name=[name].[ext]'
    },
    {
      test: /\.(gif|jpg|png)$/,
      use: 'file-loader?name=img/[name].[ext]'
    },
    {
      test: /\.svg$/,
      use: [
        'svg-inline-loader'
      ]
    },
    {
      test: /\.scss$/,
      include: [
        path.resolve(__dirname, "..", "api"),
        path.resolve(__dirname, "..", "src"),
        path.resolve(__dirname, "..", "node_modules"),
      ],
      use: [
        (isStorybook ? 'style-loader' : MiniCssExtractPlugin.loader),
        "css-loader",
        "sass-loader"
      ]
    },
    {
      test: /\.css$/,
      include: [
        path.resolve(__dirname, "..", "api"),
        path.resolve(__dirname, "..", "src"),
        path.resolve(__dirname, "..", "node_modules"),
      ],
      use: [
        (isStorybook ? 'style-loader' : MiniCssExtractPlugin.loader),
        'css-loader'
      ]
    }
  ];
}
