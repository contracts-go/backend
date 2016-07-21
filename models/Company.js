/**
 * Created by austin on 7/20/16.
 */

class Company {
    /**
     *
     * @param type
     * @param name
     * @param state
     * @param location
     */
  constructor(type, name, state, location) {
    this.type = type;
    this.name = name;
    this.state = state;
    this.location = location;
  }
}

module.exports = Company;
