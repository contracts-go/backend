/**
 * @file Created by austin on 7/20/16.
 */
const config = require('../../config/config')();
const Project = require('./Project');
const NotFoundError = require('./errors/NotFoundError');
const firebase = require('firebase');
const gcloud = require('gcloud');
const fs = require('fs');
const Q = require('q');
const handlebars = require('handlebars');
const htmlToDocx = require('html-docx-js');
const moment = require('moment');
const dateFormat = 'Do day of MMMM, YYYY';  // The 14th day of July, 2016

// Setup google cloud storage for pulling the templates and patch files
const gcStorage = gcloud.storage({
  credentials: config.firebaseCreds,
  projectId: config.firebaseProjectId,
});
const templatesBucket = gcStorage.bucket(`${config.databaseBucketUrl}/templates`);
const patchesBucket = gcStorage.bucket(`${config.databaseBucketUrl}/patches`);

/**
 * @swagger
 * definition:
 *   Document:
 *     required:
 *       - type
 *       - pi
 *       - company
 *       - project
 *       - date
 *     properties:
 *       type:
 *         type: string
 *         enum:
 *         - mutual
 *         - receiving
 *         - disclosing
 *       company:
 *         $ref: '#/definitions/Company'
 *       project:
 *         $ref: '#/definitions/User'
 *       date:
 *         type: string
 *         format: date
 *         description: 'Defaults to current time'
 *       otherEntities:
 *         type: string
 */
class Document {

  /**
   * @param {string} id
   * @param {{}} data
   */
  constructor(id, data) {
    /**
     * @type {string}
     */
    this.id = id;
    this.type = data.type;
    this.project = new Project(data.project);
    this.date = new Date(data.date);
    this.patchFile = data.patchFile;
    this.templateFile = data.templateFile;
    this.status = data.status;
    this.creator = data.creator;  // Just an id until fetched
    this.admin = data.admin;  // Just an id until fetched
    this.companyContact = data.companyContact;
    this.createdAt = new Date(data.createdAt);
  }

  /**
   * Query firebase for a document with a given id
   * @param id
   * @returns {firebase.Promise<Document>}
   */
  static getById(id) {
    // Todo: should we recurse through and get all data ie Company?
    const db = firebase.database();
    const documentsDbRef = db.ref('documents');
    return documentsDbRef.child(id).once('value')
      .then((snapshot) => { // eslint-disable-line arrow-body-style
        return new Promise((fulfill, reject) => {
          const data = snapshot.val();
          if (!data) reject(new NotFoundError(`Document:${this.id}`)); // couldn't find user
          fulfill(new Document(id, data));
        });
      });
  }

  /**
   * First we need to grab the template
   * @see https://docs.google.com/drawings/d/1_Ul2LG277zLFfBgXzrI7GLn6n9ANEkPMDl0eVYt8iZo/view
   * @returns {Promise} generated html
   */
  generateHtml() {
    // First pull the template file
    const tempFilename = `./tmp/${(new Date()).toISOString()}-${this.templateFile}`;
    const templateReadStream = templatesBucket.file(this.templateFile).createReadStream();
    const templateWriteStream = fs.createWriteStream(tempFilename);
    templateReadStream.pipe(templateWriteStream);
    templateReadStream.on('close', (data) => {
      console.log(data);
    });
    // Using Q here because a finally is needed
    return new Q.Promise((fulfill, reject) => {
      templateWriteStream.on('close', () => {
        // Read sync and fulfill to templating step
        fulfill(fs.readFileSync(tempFilename, 'utf8'));
      });
      // Errors
      templateWriteStream.on('error', reject);
      templateReadStream.on('error', reject);
    })
    .then((html) => {
      const template = handlebars.compile(html);
    })
    .finally(() => {
      // No need for synchronous
      fs.unlink(tempFilename);
    });
  }

  /**
   * Creates a Docx Zipped file
   * @returns {ArrayBuffer}
   */
  generateDocx() {
    const ndaText = this.generateHTML();
    return htmlToDocx.asBlob(ndaText);
  }
}

module.exports = Document;
