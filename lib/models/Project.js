/**
 * @file Created by austin on 7/20/16.
 */

/**
 * @swagger
 * definition:
 *   Project:
 *     required:
 *       - industry
 *       - description
 *     properties:
 *       industry:
 *         type: string
 *       description:
 *         type: string
 *
 */
class Project {
  /**
   *
   * @param industry
   * @param description
   */
  constructor(industry, description) {
    this.industry = industry;
    this.description = description;
  }
}

module.exports = Project;
