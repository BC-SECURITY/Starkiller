module.exports = {
  lintOnSave: true,
  // change these to false while developing
  // to avoid the overlay yelling at you to lint.
  devServer: {
    overlay: {
      warnings: true,
      errors: true,
    },
  },
};
