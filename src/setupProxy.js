// src/setupProxy.js

/**
 * Enables 'SharedArrayBuffer' in the browser
 */
module.exports = function (app) {
  // Middleware to set the required headers
  app.use((req, res, next) => {
    res.set({
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    });
    next();
  });
};
