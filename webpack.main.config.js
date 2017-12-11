process.env.BABEL_ENV = 'main';

const path = require('path');
const pkg = require('./app/package.json');
const webpack = require('webpack');

const mainConfig = {
  entry: {
    main: path.join(__dirname, 'app/src/main/main.js'),
  },
  externals: Object.keys(pkg.dependencies || {}),
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [/node_modules/, 'app/node_modules/'],
        query: {
          presets: ['node5', 'stage-0'],
        },
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.node$/,
        loader: 'node-loader',
      },
    ],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'app/dist'),
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
    }),
  ],
  resolve: {
    extensions: ['.js', '.json', '.node'],
    modules: [
      path.join(__dirname, 'app/node_modules'),
    ],
  },
  target: 'electron-main',
};

module.exports = mainConfig;
