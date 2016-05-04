const HtmlWebpackPlugin = require('html-webpack-plugin');
const requireDir = require('require-dir');
const path = require('path');
const webpack = require('webpack');
const getLoaders = require('./getLoaders');

const allLoaders = Object.assign(requireDir('../loaders'), requireDir('../loaders/dev'));

const env = 'development';
const globals = {
  'process.env': {
    'NODE_ENV': JSON.stringify(env)
  }
};

// https://gist.github.com/sokra/27b24881210b56bbaff7
// http://www.2ality.com/2015/12/webpack-tree-shaking.html
module.exports = function devConfig (options) {
  const loaders = getLoaders(allLoaders, options);
  return {
    devtool: 'inline-source-map',
    entry: [
      require.resolve('webpack-hot-middleware/client'),
      path.join(options.projectDir, 'src/index')
    ],
    output: {
      path: path.join(options.projectDir, 'dist'),
      filename: '[name]-[hash].js',
      publicPath: '/'
    },
    plugins: [
      new webpack.DefinePlugin(globals),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin(),
      new HtmlWebpackPlugin({
        title: 'ReactApp',
        template: path.join(options.projectDir, 'index.html')
      })
    ],
    resolve: {
      modules: [path.join(options.projectDir, 'src'), 'node_modules'],
      extensions: ['', '.js', '.json']
    },
    resolveLoader: {
      modules: [path.join(options.rootDir, 'node_modules')]
    },
    module: {
      loaders: loaders
    }
  }
};