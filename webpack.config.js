'use strict';

const webpack = require('webpack');
const path = require('path');

const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

function resolve(dir) {
  return path.join(__dirname, '.', dir);
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

const config = {
  mode: process.env.NODE_ENV,

  entry: {
    app: './src/app.js',
  },

  output: {
    path: resolve('./dist'),
    filename: '[name].build.js',
  },

  devServer: {
    hot: true,
    https: true,
    watchOptions: { poll: true },
    contentBase: resolve('dist'),
  },

  // https://webpack.js.org/configuration/optimization
  optimization: {
    minimize: isProduction(),
    noEmitOnErrors: true,
    namedModules: true,
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: false, // Must be set to true if using source-maps in production
        terserOptions: {
          // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
        },
      })
    ],
  },

  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [{ loader: MiniCssExtractPlugin.loader, options: {} }, { loader: 'css-loader', options: {} }, { loader: 'sass-loader', options: {} }],
      },
      {
        test: /\.(glsl|vs|fs)$/,
        loader: 'shader-loader',
        options: {
          glsl: {
            chunkPath: path.resolve(__dirname, './glsl/chunks'),
          },
        },
      },
      {
        test: /\.js$/,
        use: { loader: 'babel-loader', options: { cacheDirectory: true } },
        exclude: /node_modules/,
      },
    ],
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),

    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
  ],
};

module.exports = config;
