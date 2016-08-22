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
 *       addressCountry:
 *         type: string
 *       addressLocality:
 *         type: string
 *       addressRegion:
 *         type: string
 *       postalCode:
 *         type: string
 *       streetAddress:
 *         type: string
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
