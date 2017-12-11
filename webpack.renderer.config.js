process.env.BABEL_ENV = 'renderer';

const path = require('path');
const pkg = require('./app/package.json');
const settings = require('./config.js');
const webpack = require('webpack');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const rendererConfig = {
  devtool: '#eval-source-map',
  devServer: { overlay: true },
  entry: {
    renderer: path.join(__dirname, 'app/src/renderer/main.js'),
  },
  externals: Object.keys(pkg.dependencies || {}),
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader',
        }),
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader?sourceMap!sass-loader?sourceMap',
        }
        ),
      },
      {
        test: /\.html$/,
        use: 'vue-html-loader',
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        include: [path.resolve(__dirname, 'app/src/renderer')],
        exclude: [/node_modules/, path.resolve(__dirname, 'app/main')],
      },
      {
        test: /\.json$/,
        use: 'json-loader',
      },
      {
        test: /\.node$/,
        use: 'node-loader',
      },
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader',
          options: {
            loaders: {
              sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax=1',
              scss: 'vue-style-loader!css-loader!sass-loader',
            },
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'imgs/[name].[ext]',
          },
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'fonts/[name].[ext]',
          },
        },
      },
    ],
  },
  plugins: [
    new ExtractTextPlugin('styles.css'),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './app/index.ejs',
      appModules: process.env.NODE_ENV !== 'production'
        ? path.resolve(__dirname, 'app/node_modules')
        : false,
    }),
    new webpack.ProvidePlugin({
      _: 'lodash',
    }),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, 'app/dist'),
  },
  resolve: {
    alias: {
      components: path.join(__dirname, 'app/src/renderer/components'),
      renderer: path.join(__dirname, 'app/src/renderer'),
      assets: path.join(__dirname, 'app/src/renderer/assets'),
      api: path.resolve(__dirname, 'app/src/renderer/api'),
      utils: path.resolve(__dirname, 'app/src/renderer/utils'),
      store: path.resolve(__dirname, 'app/src/renderer/store'),
      router: path.resolve(__dirname, 'app/src/renderer/router'),
      lodash: path.resolve(__dirname, 'app/node_modules/lodash'),
      command: path.resolve(__dirname, 'app/src/renderer/command'),
    },
    extensions: ['.js', '.vue', '.json', '.css', '.scss', '.node'],
    modules: [
      path.join(__dirname, 'app/node_modules'),
      path.join(__dirname, 'node_modules'),
    ],
  },
  target: 'electron-renderer',
};

// if (process.env.NODE_ENV !== 'production') {
//   /**
//    * Apply ESLint
//    */
//   if (settings.eslint) {
//     rendererConfig.module.rules.push(
//       {
//         test: /\.(js|vue)$/,
//         enforce: 'pre',
//         exclude: /node_modules/,
//         use: {
//           loader: 'eslint-loader',
//           options: {
//             formatter: require('eslint-friendly-formatter'),
//           },
//         },
//       }
//     );
//   }
// }

/**
 * Adjust rendererConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  rendererConfig.devtool = '';

  rendererConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    })
  );
}

module.exports = rendererConfig;
