const gulp = require('gulp');
const fs = require('fs');
const serve = require('gulp-serve');
// Config
const config = require('./config.json');

// Documentation
const swagger = require('swagger-jsdoc');
const jsdoc = require('gulp-jsdoc3');

gulp.task('apidoc', () => {
  // Generate the swagger
  const swaggerDef = {
    info: {
      title: 'Contracts-Go Api',
      description: 'The Contracts-Go Api',
      version: config.version,
    },
    host: `${config.basePath}:${config.port}`,
  };
  const swaggerOpts = {
    swaggerDefinition: swaggerDef,
    apis: ['./server.js', './models/*.js'],
  };
  const swaggerSpec = swagger(swaggerOpts);

  // Create the tmp directory to store the ndas for emailing
  if (!fs.existsSync('./docs')) {
    fs.mkdirSync('./docs');
  }
  const file = fs.createWriteStream(`${__dirname}/docs/swagger.js`);
  file.once('open', () => {
    file.write(JSON.stringify(swaggerSpec));
    file.end();
  });
});

gulp.task('doc', (cb) => {
  gulp.src(['./server.js', './lib/**/*.js'])
    .pipe(jsdoc(cb));
});

gulp.task('servedocs', ['doc', 'apidoc'], () => {
  console.log('Serving!');
  serve({
    root: ['docs'],
    port: 8080,
  });
});

gulp.task('default');
