const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(createProxyMiddleware('/logo.png', {target: 'https://training.ctf.hitb.org/', ws: true, changeOrigin: true}));
    app.use(createProxyMiddleware('/api/events', {target: 'https://training.ctf.hitb.org/', ws: true, changeOrigin: true}));
    app.use(createProxyMiddleware('/api', {target: 'https://training.ctf.hitb.org/', changeOrigin: true}));
    app.use(createProxyMiddleware('/history', {target: 'https://training.ctf.hitb.org/', changeOrigin: true}));
    app.use(createProxyMiddleware('/data',{target: 'https://training.ctf.hitb.org/', changeOrigin: true}));
};
