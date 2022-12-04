// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require('webpack');

module.exports = {
  configureWebpack: {
    plugins: [
      // new BundleAnalyzerPlugin(),
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
    ],
  },

  lintOnSave: true,

  // change these to false while developing
  // to avoid the overlay yelling at you to lint.
  devServer: {
    overlay: {
      warnings: false,
      errors: true,
    },
  },

  transpileDependencies: [
    'vuetify',
  ],
};
