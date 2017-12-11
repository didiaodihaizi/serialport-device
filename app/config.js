module.exports = {
  root: __dirname,
  version: require('./package.json').version,
  ports: {
    // koa server port
    server: 56719,
    // dev port
    dev: 9080,
  },
  root_url: 'http://localhost:56719',
};
