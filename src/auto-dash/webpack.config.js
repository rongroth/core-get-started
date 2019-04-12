/* eslint-env node */

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  context: path.resolve(__dirname),
  entry: {
    app: ['./app.js']
  },
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    host: '0.0.0.0',
    port: '8080',
    disableHostCheck: true
  },
  stats: {
    colors: true,
    modules: true,
    reasons: true,
    errorDetails: true,
  },
  node: {
      fs: "empty"
  },
  devtool: 'source-map',
  module: {
    rules: [{
        test: /\.html$/,
        loader: 'raw-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [path.resolve(__dirname, 'node_modules')],
        query: {
          presets: ['@babel/preset-env']
        },
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin([{
        from: 'index.html'
      },
      {
        from: 'app.html'
      },
      {
        from: 'dynamicTable.tmpl.html'
      },
      {
        from: 'app.css'
      },
      {
        from: 'personDetailsData.json'
      },
      {
        from: 'personDetailsStructure.json'
      },
      {
        from: 'productTableData.json'
      },
      {
        from: 'productTableStructure.json'
      },
      {
        from: 'autoDashSpec.json'
      },
      {
        from: 'table01.ds.json'
      },
      {
        from: 'table01.json'
      },
      {
        from: 'resources/',
        to: 'resources/'
      },
    ]),
  ],
};
