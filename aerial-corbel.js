/* jshint esversion: 6 */

// Write your package code here!

// Variables exported by this module can be imported by other packages and
// applications. See aerial-composr-tests.js for an example of importing.
let CH = null,
    adminToken = null,
    path = Npm.require('path'),
    Future = Npm.require(path.join('fibers', 'future')),
    Fiber = Npm.require('fibers');

Meteor.AerialRestDriver = AerialRestDriver = function () {

    let _cached = {};

    function addCollection(name) {
      if (_cached[name]) {
        return;
      }

      _cached[name] = {};
    }

    this.get = ( coll, selector, options={} ) => {

        if (coll.name === 'users' || coll.name.indexOf('meteor') !== - 1 || coll.name.indexOf('__dummy') !== - 1) {
          return;
        }

        let corbelDriver = this._getCorbelDriver(options.userId);

        if (!corbelDriver) {
          return;
        }

        let sTime = new Date().getTime();

        let allDocs = coll.find({}, { cpsr: true }).fetch(),
            corbelDocs = CorbelHandler.get(corbelDriver, coll.name, { selector, options }),
            args = {
                length: 0
              },
            allIds = _.pluck(allDocs, 'id'),
            corbelIds = _.pluck(corbelDocs, 'id');

        if (!_.isArray(corbelDocs)) {
          corbelDocs = [corbelDocs];
        }

        for (var i = 0; i <= corbelDocs.length; i++) {
          args.length++;
          args[i] = i === 0 ? allIds : corbelIds[i - 1];
        }

        let toRemove = _.without.apply(_, args);

        _.each(toRemove, doc => {
          coll.remove(doc);
        });

        _.each(corbelDocs, doc => {

            doc._id = doc.id;
            if (!coll.findOne(doc.id, { cpsr:true })) {
              coll.insert(doc);
            }
            else {
              let id = doc._id;
              delete doc._id;
              coll.update(id, { $set: doc }, { cpsr: true });
            }
          });

      };

    this.count = ( coll, selector, options ) => {
      let corbelDriver = this._getCorbelDriver();

      if (!corbelDriver || coll.name === 'users' || coll.name.indexOf('meteor') !== - 1) {
        return;
      }

      return CorbelHandler.count(corbelDriver, coll.name, { selector, options });
    };

    this.distinct = ( coll, selector, options, dist ) => {
      let corbelDriver = this._getCorbelDriver();

      if (!corbelDriver || coll.name === 'users' || coll.name.indexOf('meteor') !== - 1) {
        return;
      }
      return CorbelHandler.distinct(corbelDriver, coll.name, { selector, options }, dist);
    };

    this.update = ( coll, selector={}, modifier, options={} ) => {
      let colName = typeof coll === 'string' ? coll : coll.name || coll._name;

      let corbelDriver = this._getCorbelDriver();

      if (!corbelDriver) {
        console.log('no corbel driver');
        return;
      }

      if (colName === 'users' || colName.indexOf('meteor') !== - 1) {
        console.log('users or meteor collection');
        return;
      }


      return CorbelHandler.update(corbelDriver, colName, { selector, modifier, options });
    };

    this.remove = ( colName, selector, options ) => {
        let corbelDriver = this._getCorbelDriver();

        if (!corbelDriver || colName === 'users' || colName.indexOf('meteor') !== - 1) {
          return;
        }

        return CorbelHandler.remove(corbelDriver, colName, { selector, options });
      };

    this.insert = ( colName, doc, opts ) => {
      let corbelDriver = this._getCorbelDriver();

      if (!corbelDriver || colName === 'users' || colName.indexOf('meteor') !== - 1) {
        return;
      }

      return CorbelHandler.insert(corbelDriver, colName, doc, opts.domain);
    };


    this._getCorbelDriver = function (userId) {

        Tracker.nonreactive(function () {
            userId = userId || Meteor.userId();
          });

        if (!userId) {
          return;
        }

        let corbelDriver = Accounts.getCorbelDriver(userId);

        if (!corbelDriver) {
          console.log('No corbelDriver');
          throw new Meteor.Error(403, 'Authentication error');
        }

        let refreshTokenCallback = function (newTokenData) {
          console.log('refresh token');
          Accounts.refreshUserToken(userId, newTokenData);
        };

        let onRequestCallback = function (request) {
          corbelDriver.off('token:refresh', refreshTokenCallback);
          corbelDriver.off('service:request:after', onRequestCallback);
        };

        corbelDriver.on('token:refresh', refreshTokenCallback);

        corbelDriver.on('service:request:after', onRequestCallback);

        return corbelDriver;
      };


    this.configured = true;

  };
