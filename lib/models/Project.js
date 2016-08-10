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
   * @param {{industry: string, description: string}} data
   */
  constructor(data) {
    this.industry = data.industry;
    this.description = data.description;
  }
}

module.exports = Project;
