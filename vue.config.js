module.exports = {
  lintOnSave: true,
  // change these to false while developing
  // to avoid the overlay yelling at you to lint.
  devServer: {
    overlay: {
      warnings: false,
      errors: true,
    },
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  },
};
