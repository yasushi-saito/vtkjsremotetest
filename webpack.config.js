var path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const autoprefixer = require('autoprefixer');

// https://github.com/webpack/webpack-dev-server/issues/1406

module.exports = (env, argv) => ({
  mode: "development",
  output: {
    path: path.join(__dirname, "dist"),
    filename: 'app.bundle.js'
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      PVWStyle: path.resolve(__dirname, './node_modules/paraviewweb/style'),
    },
  },
  devtool: 'source-map',
  entry: ['./src/index.tsx'],
  module: {
      rules: [
        {
          test: /\.ts(x?)$/,
          exclude: /node_modules|old/,
          loader: 'ts-loader',
        }, {
          test: /\.js$/,
          include: /node_modules(\/|\\)vtk.js(\/|\\)/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
              },
            },
          ],
        }, {
          test: /\.js$/,
          include: /node_modules(\/|\\)vtk.js(\/|\\)/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
              },
            },
          ],
        }
      ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'index.html', to: 'index.html' },
      ],
    }),
  ],
  devServer: {
    static: path.join(__dirname, "dist"),
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    },
  }
});
