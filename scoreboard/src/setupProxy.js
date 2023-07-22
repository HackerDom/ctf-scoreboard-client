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
    app.use(proxy('/logo.png', {target: 'https://training.ctf.hitb.org/', ws: true, changeOrigin: true}));
    app.use(proxy('/api/events', {target: 'https://training.ctf.hitb.org/', ws: true, changeOrigin: true}));
    app.use(proxy('/api', {target: 'https://training.ctf.hitb.org/', changeOrigin: true}));
    app.use(proxy('/history', {target: 'https://training.ctf.hitb.org/', changeOrigin: true}));
    app.use(proxy('/data', {target: 'https://training.ctf.hitb.org/', changeOrigin: true}));
};
