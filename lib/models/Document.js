/**
 * @file Created by austin on 7/20/16.
 */
const config = require('../../config/config')();
const Project = require('./Project');
const User = require('./User');
const NotFoundError = require('./errors/NotFoundError');
const firebase = require('firebase');
const gcloud = require('gcloud');
const diffMatchPatch = require('diff-match-patch');
const fs = require('fs');
const Q = require('q');
const handlebars = require('handlebars');
const htmlToDocx = require('html-docx-js');
const moment = require('moment');
const dateFormat = 'Do [day of] MMMM, YYYY';  // The 14th day of July, 2016

// Setup google cloud storage for pulling the templates and patch files
const gcStorage = gcloud.storage({
  credentials: config.firebaseCreds,
  projectId: config.firebaseProjectId,
});
const bucket = gcStorage.bucket(config.databaseBucketUrl);
const templatesBucket = gcStorage.bucket(`${config.databaseBucketUrl}/templates`);
const patchesBucket = gcStorage.bucket(`${config.databaseBucketUrl}/patches`);

const patcher = new diffMatchPatch.diff_match_patch();  // eslint-disable-line new-cap

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
    this.title = data.title;
    this.type = data.type;
    this.project = new Project(data.project);
    this.createdAt = new Date(data.createdAt);
    this.date = new Date(data.date);
    this.patchFile = data.patchFile;
    this.templateFile = data.templateFile;
    this.status = data.status;
    this.creatorId = data.creator;  // Just an id until fetched
    this.adminId = data.admin;  // Just an id until fetched
    this.companyContactId = data.companyContact;
    this.createdAt = new Date(data.createdAt);
    this._hasFetchedData = false;
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
          // couldn't find user
          if (!data) reject(new NotFoundError({ resource: `Document:${id}` }));
          fulfill(new Document(id, data));
        });
      });
  }

  /**
   * First we need to grab the template
   * @see https://docs.google.com/drawings/d/1_Ul2LG277zLFfBgXzrI7GLn6n9ANEkPMDl0eVYt8iZo/view
   * @returns {Promise<Handlebars>} handlebars template
   * @private
   */
  _fetchTemplate() {
    // First pull the template file
    const tempFilename = `./tmp/${(new Date()).toISOString()}-${this.templateFile}`;
    const templateReadStream = templatesBucket.file(this.templateFile).createReadStream();
    const templateFile = fs.createWriteStream(tempFilename);
    templateReadStream.pipe(templateFile);
    // Using Q here because a finally is needed
    return new Q.Promise((fulfill, reject) => {
      templateFile.on('close', () => {
        // Read sync and fulfill to templating step
        fulfill(fs.readFileSync(tempFilename, 'utf8'));
      });
      // Reject on any error
      templateFile.on('error', reject);
      templateReadStream.on('error', reject);
    })
    .then((html) => { // eslint-disable-line arrow-body-style
      // Compile the template
      return handlebars.compile(html);
    })
    .finally(() => {
      // No need for synchronous deletion
      fs.unlink(templateFile.path);
    });
  }

  /**
   * Grabs the patch file and reads it to a string
   * @see https://docs.google.com/drawings/d/1_Ul2LG277zLFfBgXzrI7GLn6n9ANEkPMDl0eVYt8iZo/view
   * @returns {Promise<string>} patchfile text
   * @private
   */
  _fetchPatch() {
    const tempFilename = `./tmp/${(new Date()).toISOString()}-${this.patchFile}`;
    const patchReadStream = patchesBucket.file(this.patchFile).createReadStream();
    const patchWriteStream = fs.createWriteStream(tempFilename);
    patchReadStream.pipe(patchWriteStream);
    // Using Q here because a finally is needed
    return new Q.Promise((fulfill, reject) => {
      patchWriteStream.on('close', () => {
        // Read sync and fulfill to templating step
        fulfill(fs.readFileSync(tempFilename, 'utf8'));
      });
      // Reject on any error
      patchWriteStream.on('error', reject);
      patchReadStream.on('error', reject);
    })
      .finally(() => {
        // No need for synchronous deletion
        fs.unlink(tempFilename);
      });
  }

  /**
   * Caches all data necessary for template generation
   * Note: Needs to be performed before template is filled
   * @return {firebase.Promise<any>}
   */
  fetchData() {
    // Need to fetch:
    // creator --> pi
    // admin --> 'David'
    // companyContact --> contact
    // companyContact's Company
    this._hasFetchedData = true;
    return User.getById(this.creatorId)
      .then((creatorObj) => {
        /**
         * A place to store the fetched creator
         * @type {User}
         */
        this.creator = creatorObj;
        return User.getById((this.adminId));
      })
      .then((adminObj) => {
        /**
         * A place to store the fetched admin
         * @type {User}
         */
        this.admin = adminObj;
        return User.getById(this.companyContactId);
      })
      .then((companyContactObj) => {
        /**
         * A place to store the fetched companyContact
         * @type {User}
         */
        this.companyContact = companyContactObj;
        return this.companyContact.fetchCompany();
      })
      .then((companyContactCompanyObj) => {
        // Store the
        this.companyContact.company = companyContactCompanyObj;
        return 'Fetched'; // Unnecessary, just to call something back
      });
  }

  /**
   * Fills in a template with all relevant data
   * @param template - a handlebars template
   * @return {firebase.Promise<string>}
   * @private
   */
  _fillTemplate(template) {
    return this.fetchData()
      .then(() => {
        return template({
          dateString: moment(this.date).format(dateFormat),
          pi: this.creator,
          company: this.companyContact.company,
          project: this.project,
        });
      });
  }

  /**
   * Takes a filled template and applies the patchfile to it
   * @param {string} filledTemplate
   * @return {Promise.<string>}
   * @private
   */
  _applyPatch(filledTemplate) {
    // First: Get. That. Patch!!!
    return this._fetchPatch()
      .then((patchText) => {
        const patches = patcher.patch_fromText(patchText);
        // Ignore the second return element, just contains 'results'
        return patcher.patch_apply(patches, filledTemplate)[0];
      });
  }

  /**
   * Fetches, gets data, fills the template, and applies patch
   * Generates a final html string
   * @return {Promise.<string>}
   */
  generate() {
    let prom;
    // If the data hasn't been fetched, fetch it!
    if (this._hasFetchedData) {
      prom = this.fetchData().then(() => { return this._fetchTemplate(); });
    } else {
      prom = this._fetchTemplate();
    }
    return prom
      .then((template) => {
        return this._fillTemplate(template);
      })
      .then((filled) => {
        // If there is no patch file, nothing to patch!
        if (!this.patchFile || this.patchFile === '') {
          return filled;
        }
        return this._applyPatch(filled);
      });
  }

  /**
   *
   * @param {string} [htmlText = null]
   * @return {Promise<ArrayBuffer>}
   */
  generateDocx(htmlText = null) {
    let promise;
    // Allows to pass in already gotten html
    if (htmlText) {
      promise = new Promise((fulfill) => {
        fulfill(htmlToDocx.asBlob(htmlText));
      });
    } else {
      promise = this.generate()
        .then((html) => {
          return htmlToDocx.asBlob(html);
        });
    }
    return promise;
  }

  /**
   * Takes some new text and patches it with the generated text
   * @private
   */
  _generatePatch(newText) {
    return this.generate().then((origText) => {
      const patches = patcher.patch_make(origText, newText);
      return patcher.patch_toText(patches);
    });
  }

  patch(newText) {
    let tempFilename;
    // Make patches
    return this._generatePatch(newText)
      .then((patchText) => {
        // Save patch file
        tempFilename = `./tmp/${(new Date()).toISOString()}-patch.txt`;
        return fs.writeFileSync(tempFilename, patchText);
      })
      .then(() => {
        if (!this.patchFile || this.patchFile === '') {
          // Generate a unique name and save it to the database
          const db = firebase.database();
          const documentsDbRef = db.ref('documents');
          this.patchFile = `${this.createdAt.toISOString()}-${this.creatorId}.txt`;
          documentsDbRef.child(this.id).update({
            patchFile: this.patchFile,
          });
        }
        const filename = `./tmp/${this.patchFile}`;
        fs.renameSync(tempFilename, filename);
        tempFilename = filename;
        // Upload new patch to server
        const patchWriteStream = bucket.file(`patches/${this.patchFile}`).createWriteStream({
          metadata: {
            contentType: 'text/plain',
          },
        });
        const fileReadStream = fs.createReadStream(tempFilename);

        return new Q.Promise((fulfill, reject) => {
          patchWriteStream.on('finish', fulfill);
          patchWriteStream.on('error', reject);
          fileReadStream.on('error', reject);
          fileReadStream.pipe(patchWriteStream);
        });
      })
      .finally(() => {
        // Remove temp file if we got that far
        if (tempFilename) fs.unlink(tempFilename);
      });
  }
}

module.exports = Document;
