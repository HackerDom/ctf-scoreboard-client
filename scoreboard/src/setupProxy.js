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

module.exports = function (app) {
    app.use(proxy('/logo.png', {target: 'http://10.10.10.10:8080/', ws: true, changeOrigin: true}));
    app.use(proxy('/api/events', {target: 'http://10.10.10.10:8080/', ws: true, changeOrigin: true}));
    app.use(proxy('/api', {target: 'http://10.10.10.10:8080/', changeOrigin: true}));
    app.use(proxy('/history', {target: 'http://10.10.10.10:8080/', changeOrigin: true}));
    app.use(proxy('/data', {target: 'http://10.10.10.10:8080/', changeOrigin: true}));
};
