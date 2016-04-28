// Write your package code here!

// Variables exported by this module can be imported by other packages and
// applications. See aerial-composr-tests.js for an example of importing.
let CH = null,
    adminToken = null,
    path = Npm.require('path'),
    Future = Npm.require(path.join('fibers', 'future'));

AerialRestDriver = function (conf) {
  let future = new Future;

  CH = CorbelSingleton(conf);

  // var wCB = Meteor.wrapAsync(function (coll, f) {
  //   if (!f)
  //     return function () {};
  //
  //   return function (/*args*/) {
  //     var context = this,
  //         args = arguments;
  //
  //     if (coll.paused)
  //       return;
  //
  //     coll._observeQueue.queueTask(function () {
  //       f.apply(context, args);
  //     });
  //   };
  // });

  // NOTE: this is only for development purporse without accounts
  //
  this.get = (coll, selector, options) => {

    if (coll.name === 'users' || coll.name.indexOf('meteor') !== -1) {
      return;
    }

    _.each(CH.get(adminToken, coll.name, { selector, options }), (doc) => {
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
    if (coll.name === 'users' || coll.name.indexOf('meteor') !== -1) {
      return;
    }

    return CH.count(adminToken, coll.name, { selector, options });
  };

  this.distinct = (coll, selector, options, dist) => {
    if (coll.name === 'users' || coll.name.indexOf('meteor') !== -1) {
      return;
    }

    return CH.distinct(adminToken, coll.name, {selector, options}, dist);
  };

  if (!adminToken) {

    CH.loginUserWithPassword({
      name: 'adminbooks@bq.com',
      password: 'admin',
    },
    (res) => {
      adminToken = res.data;
      this.configured = true;

      future.return();
    });
  }

  return future.wait();

}
