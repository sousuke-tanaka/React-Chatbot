const webpack = require("webpack");
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, 'lib/index'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'react-simple-chatbot.js',
    publicPath: 'dist/',
    library: 'ReactSimpleChatbot',
    libraryTarget: 'umd',
  },
  devServer: {
    outputPath: path.join(__dirname, 'build'),
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      compress: false,
    }),
  ],
  debug: true,
  devtool: 'sourcemap',
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loaders: ['babel'],
      },
      {
        test: /\.mp3$/,
        loader: 'file-loader',
      },
    ],
  },
};
