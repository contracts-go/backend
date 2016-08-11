/**
 * Created by austin on 8/10/16.
 */

/**
 * @swagger
 * definition:
 *   PostalAddress:
 *     required:
 *       - addressCountry
 *       - addressLocality
 *       - addressRegion
 *       - postalCode
 *       - streetAddress
 *     properties:
 *       name:
 *         type: string
 *       email:
 *         type: string
 *       type:
 *         type: string
 *       company:
 *         type: string
 *       documents:
 *         type: array
 *         items:
 *            type: string
 *       title:
 *         type: string
 *         default: ''
 */
class PostalAddress {
  /**
   * @param {{}} data
   */
  constructor(data) {
    this.addressCountry = data.addressCountry;
    this.addressLocality = data.addressLocality;
    this.addressRegion = data.addressRegion;
    this.postOfficeBoxNumber = data.postOfficeBoxNumber;
    this.postalCode = data.postalCode;
    this.streetAddress = data.streetAddress;
  }

  get readable() {
    return `${this.streetAddress}, ${this.addressLocality}, ${this.addressRegion}`;
  }
}

module.exports = PostalAddress;
