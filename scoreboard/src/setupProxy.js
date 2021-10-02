const proxy = require('http-proxy-middleware');

/*
  "proxy": {
    "^/api/events": {
      "target": "http://10.60.3.1",
      "ws": true,
      "changeOrigin": true
    },
    "/": {
      "target": "http://10.60.3.1",
      "changeOrigin": true
    }
  },
*/

module.exports = function(app) {
  app.use(proxy('/api/events', { target: 'http://127.0.0.1:8080/', ws: true, changeOrigin: true }));
  app.use(proxy('/api', { target: 'http://127.0.0.1:8000/', changeOrigin: true }));
  app.use(proxy('/history', { target: 'http://127.0.0.1:8000/', changeOrigin: true }));
};
