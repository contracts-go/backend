const gulp = require('gulp');
const taskListing = require('gulp-task-listing');
const fs = require('fs');
const serve = require('gulp-serve');
// Config, defaulted to production for now
const config = require('./config/config.json').production;

// Documentation
const swagger = require('swagger-jsdoc');
const jsdoc = require('gulp-jsdoc3');

const sourceFiles = ['./server.js', './lib/**/*.js'];

gulp.task('help', taskListing);

gulp.task('doc-swagger', () => {
  // Generate the swagger
  const swaggerDef = {
    info: {
      title: 'Contracts-Go Api',
      description: 'The Contracts-Go Api',
      version: config.version,
    },
    host: `${config.basePath}:${config.port}`,
    consumes: ['application/json'],
    produces: ['application/json'],
    schemes: ['http'],  // https coming soon
  };
  const swaggerOpts = {
    swaggerDefinition: swaggerDef,
    apis: sourceFiles,
  };
  const swaggerSpec = swagger(swaggerOpts);

  if (!fs.existsSync('./docs')) {
    fs.mkdirSync('./docs');
  }
  const file = fs.createWriteStream(`${__dirname}/docs/swagger.js`);
  file.once('open', () => {
    file.write(JSON.stringify(swaggerSpec));
    file.end();
  });
});

gulp.task('doc-jsdoc', (cb) => {
  gulp.src(sourceFiles)
    .pipe(jsdoc(cb));
});

gulp.task('doc', ['doc-swagger', 'doc-jsdoc']);

gulp.task('servedocs', ['doc'], () => {
  console.log('Serving!');
  serve({
    root: ['docs'],
    port: 8080,
  });
});

gulp.task('default', ['help']);
