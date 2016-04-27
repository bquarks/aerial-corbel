// Write your package code here!

// Variables exported by this module can be imported by other packages and
// applications. See aerial-composr-tests.js for an example of importing.
let CH = null,
    adminToken = null;

AerialRestDriver = function (conf) {

  CH = CorbelSingleton(conf);

  var wCB = Meteor.wrapAsync(function (coll, f) {
    if (!f)
      return function () {};

    return function (/*args*/) {
      var context = this,
          args = arguments;

      if (coll.paused)
        return;

      coll._observeQueue.queueTask(function () {
        f.apply(context, args);
      });
    };
  });

  // NOTE: this is only for development purporse without accounts
  if (!adminToken) {
    CH.loginUserWithPassword({
      name: 'adminbooks@bq.com',
      password: 'admin',
    },
    (res) => {
      adminToken = res.data;
      this.configured = true;
    });
  }

  this.get = (coll, selector, options) => {

    if (coll.name === 'users' || coll.name.indexOf('meteor') !== -1) {
      return;
    }

    _.each(CH.get(adminToken, coll.name, { selector, options }), (doc) => {
      doc._id = doc.id;

      try {
        coll.insert(doc);
      }
      catch (e) {

        let id = doc._id;
        delete doc._id;

        coll.update(id, doc);
      }
    });

    // TODO: transform here the selector for the composr query.

  };

  this.count = (coll, selector, options) => {
    if (coll.name === 'users' || coll.name.indexOf('meteor') !== -1) {
      return;
    }

    return CH.count(adminToken, coll.name, { selector, options });
  };

  this.distinct = (coll, selector, options, distinct) => {
    if (coll.name === 'users' || coll.name.indexOf('meteor') !== -1) {
      return;
    }

    return CH.distinct(adminToken, coll.name, {selector, options}, dist);
  }
};
