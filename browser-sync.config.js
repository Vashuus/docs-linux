module.exports = {
  server: {
    baseDir: "/app/html",
    index: "index.html",
    routes: {
      "/css": "/app/css",
      "/js": "/app/js",
      "/data": "/app/data",
      "/svg": "/app/svg",
      "/scripts": "/app/scripts",
      "/img": "/app/img"
    }
  },
  files: [
    "/app/html/**/*",
    "/app/css/**/*",
    "/app/js/**/*",
    "/app/data/**/*",
    "/app/svg/**/*",
    "/app/scripts/**/*"
  ],
  port: 8080,
  ui: false,
  open: false,
  notify: false,
  ghostMode: false,
  online: false
};
