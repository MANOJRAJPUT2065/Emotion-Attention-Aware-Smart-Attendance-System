// const { override, addWebpackAlias, addWebpackPlugin } = require('customize-cra');
// const path = require('path');
// const webpack = require('webpack');

// module.exports = override(
//   addWebpackAlias({
//     'stream': path.resolve(__dirname, 'node_modules/stream-browserify'),
//     'buffer': path.resolve(__dirname, 'node_modules/buffer')
//   }),
//   addWebpackPlugin(
//     new webpack.ProvidePlugin({
//       Buffer: ['buffer', 'Buffer'],
//     })
//   )
// );



const { override, addWebpackAlias, addWebpackPlugin } = require('customize-cra');
const path = require('path');
const webpack = require('webpack');

module.exports = override(
  addWebpackAlias({
    'stream': path.resolve(__dirname, 'node_modules/stream-browserify'),
    'buffer': path.resolve(__dirname, 'node_modules/buffer')
  }),
  addWebpackPlugin(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    })
  ),
  // 👇 This disables source-map-loader for node_modules to remove warnings
  (config) => {
    const sourceMapLoader = config.module.rules.find(
      (rule) =>
        rule.enforce === 'pre' &&
        rule.use &&
        rule.use.some((u) => u.loader && u.loader.includes('source-map-loader'))
    );

    if (sourceMapLoader) {
      sourceMapLoader.exclude = /node_modules/;
    }

    return config;
  }
);
