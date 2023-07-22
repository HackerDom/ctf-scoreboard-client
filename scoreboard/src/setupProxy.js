const { createProxyMiddleware } = require('http-proxy-middleware');

let target_host = 'http://10.10.10.10:8080/';

module.exports = function (app) {
    app.use(createProxyMiddleware('/logo.png', {target: target_host, ws: true, changeOrigin: true}));
    app.use(createProxyMiddleware('/api/events', {target: target_host, ws: true, changeOrigin: true}));
    app.use(createProxyMiddleware('/api', {target: target_host, changeOrigin: true}));
    app.use(createProxyMiddleware('/history', {target: target_host, changeOrigin: true}));
    app.use(createProxyMiddleware('/data',{target: target_host, changeOrigin: true}));
};
