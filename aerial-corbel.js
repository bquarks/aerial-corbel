// Write your package code here!

// Variables exported by this module can be imported by other packages and
// applications. See aerial-composr-tests.js for an example of importing.
let CH = null,
    adminToken = null,
    path = Npm.require('path'),
    Future = Npm.require(path.join('fibers', 'future'));

AerialRestDriver = function (conf) {
  let future = new Future;

  this.get = (coll, selector, options) => {
    let corbelHandler = this._getCorbelHandler();

    if (coll.name === 'users' || coll.name.indexOf('meteor') !== -1) {
      return;
    }

    _.each(corbelHandler.get(coll.name, { selector, options }), (doc) => {
      doc._id = doc.id;

      if (!coll.findOne(doc.id, {cpsr:true})) {
        coll.insert(doc);
      }
      else {
        let id = doc._id;
        delete doc._id;

        coll.update(id, doc);
      }
    });

    // TODO: transform here the selector for the composr query.

  };

  this.count = (coll, selector, options) => {
    let corbelHandler = this._getCorbelHandler();

    if (coll.name === 'users' || coll.name.indexOf('meteor') !== -1) {
      return;
    }

    return corbelHandler.count(coll.name, { selector, options });
  };

  this.distinct = (coll, selector, options, dist) => {
    let corbelHandler = this._getCorbelHandler();

    if (coll.name === 'users' || coll.name.indexOf('meteor') !== -1) {
      return;
    }

    return corbelHandler.distinct(coll.name, {selector, options}, dist);
  };

  return future.wait();

};

AerialRestDriver.prototype.getCorbelHandler = function () {
  let userId = Meteor.userId();

  if (!userId) {
    return;
  }

  let corbelDriver = Accounts.getCorbelDriver(userId);

  if (corbelDriver) {
    return createCorbelHandler(corbelDriver);
  }
};
