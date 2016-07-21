/* jshint esversion: 6 */

var Corbel = Npm.require('corbel-js'),
    path = Npm.require('path'),
    Future = Npm.require(path.join('fibers', 'future')),
    userCollections = ['corbelUser', 'assets', 'paymentPlan', 'product', 'paymentMethod'],
    clientConfig = null,
    CHInstance = null;

var parseCorbelError = function (e) {
    let errorMessage = e.data ? e.data.errorDescription : 'No error description provided.',
        errorCode = e.status || e.statusCode;

    return new Meteor.Error(errorCode, errorMessage);
  };

let success = function onSuccess(res) {
  if (res.data || ( res.status >= 200 && res.status < 300 ) ) {
    this.fn(null, res.data);
  }
  else {
    this.fn('No data');
  }
};

let userActions = {
  get: {
    corbelUsers: function getUserData(corbelDriver, query, domain, fn) {
      domain = domain || corbelDriver.config.config.domain;

      corbelDriver.domain(domain).iam.users().get(query)
        .then(success.bind({ fn:fn }))
        .catch(err => {
          fn(err);
        });
    },

    assets: function getAssets(corbelDriver, query, domain, fn) {
      corbelDriver.assets.asset('all').get(query).then(success.bind({ fn:fn }))
      .catch(err => {
        fn(err);
      });
    },

    payment: function getPayment(corbelDriver, query, domain, fn) {
      // if (!query && !query.query[0] && !query.query[0].$eq && !query.query[0].$eq.userId) {
      //   fn('Wrong query');
      //   return;
      // }
      //
      // let uId = query.query[0].$eq.userId;

      corbelDriver.ec.payment().getAll(query).then(success.bind({ fn:fn }))
      .catch(err => {
        fn(err);
      });
    },

    paymentPlan: function getPaymentPlan(corbelDriver, query, domain, fn) {
      corbelDriver.ec.paymentPlan().getAll(query).then(success.bind({ fn:fn }))
      .catch(err => {
        fn(err);
      });
    },

    paymentMethod: function getPaymentMethod(corbelDriver, query, domain, fn) {
      if (!query && !query.query[0] && !query.query[0].$eq && !query.query[0].$eq.userId) {
        fn('Wrong query');
        return;
      }

      let uId = query.query[0].$eq.userId;

      corbelDriver.ec.paymentMethod().get(uId).then(success.bind({ fn:fn }))
      .catch(err => {
        fn(err);
      });
    },

    products: function getProduct(corbelDriver, query, domain, fn) {
      corbelDriver.ec.product().getAll(query).then(success.bind({ fn:fn }))
      .catch(err => {
        fn(err);
      });
    },

    devices: function getDevices(corbelDriver, query, domain, fn, options) {
      domain = domain || corbelDriver.config.config.domain;
      if (!options || !options.deviceuid) {
        fn(null, []);
        return;
      }

      corbelDriver.domain(domain).iam.user(options.deviceuid).getDevices()
        .then(success.bind({ fn:fn }))
        .catch(err => {
          fn(err);
        });
    }
  },

  delete: {
    devices: function deleteDevice(corbelDriver, query, domain, fn, options) {
      domain = domain || corbelDriver.config.config.domain;
      if (!options || !options.deviceuid) {
        fn(null, 0);
        return;
      }

      if (!query && !query.query[0] && !query.query[0].$eq && !query.query[0].$eq._id) {
        fn('Wrong query');
        return;
      }

      corbelDriver.domain(domain).iam.user(options.deviceuid).deleteDevice(query.query[0].$eq._id)
        .then(() => {
          fn(null, 1);
        })
        .catch(err => {
          fn(err);
        });
    }
  }
};

CorbelHandler = {

    getRequest( corbelDriver, relation, query, domain ) {
      // TODO: avoid repeat the first methods
      let curDomain = domain || corbelDriver.config.config.domain;

      if (relation.method === 'relation') {
        return corbelDriver.domain(curDomain).resources[relation.method](relation.from, relation.field, relation.to).get(relation.id, relation.id ? {} : query);
      }
      else {
        return corbelDriver.domain(curDomain).resources[relation.method](relation.name).get(query);
      }
    },

    get( corbelDriver, collection, getParams ) {
      if (collection && getParams) {
        let future = new Future,
            query = QueryTranslator.query(getParams.selector),
            relation = QueryTranslator.relation(collection, getParams.options),
            distinct = QueryTranslator.distinct(getParams.distinct),
       domain = getParams.options.domain;

        _.extend(query, QueryTranslator.options(getParams.options), distinct);

        if (userActions.get[collection]) {
          userActions.get[collection](corbelDriver, query, domain, ( err, res ) => {
            if (err) {
              future.throw(err);
            }
            else {
              future.return(res);
            }
          }, getParams.options);

          return future.wait();
        }


        CorbelHandler
        .getRequest(corbelDriver, relation, query, domain)
        .then(( res ) => {
            if (res && res.data) {
              future.return(res.data);
            }
          })
        .catch(( e ) => {
            Meteor.call('elephantInvalidate', getParams.options.MD5);
            future.throw(parseCorbelError(e));
          });

        return future.wait();
      }
      else {
        if (!collection) {
          throw new TypeError('The second parameter must be a collection name');
        }

        if (!getParams) {
          throw new TypeError('The third parameter must be a valid get params object');
        }
      }
    },

    insert( corbelDriver, collection, doc ) {
      // TODO: this couldn't be necesary
    },

    update( corbelDriver, collectionName, params ) {
      if (collectionName && params) {
        let future = new Future,
            options = params.options,
            domain = options.domain,
            data = QueryTranslator.getUpdateModifier(params.modifier),
            query = !params.selector._id && !params.selector.id ? QueryTranslator.query(params.selector) : params.selector._id || params.selector.id;

        CorbelHandler
        .updateRequest(corbelDriver, collectionName, query, data, options, domain)
        .then(( res ) => {
            if (res) {
              Meteor.call('elephantUpdate', params.selector, params.modifier, params.options);
              future.return(res.data);
            }
          })
        .catch(( e ) => {
            future.throw(parseCorbelError(e));
          });

        return future.wait();
      }
      else {
        if (!collectionName) {
          throw new TypeError('The second parameter must be a collection name.');
        }
        if (!params) {
          throw new TypeError('The third parameter must be a valid get params object');
        }
      }
    },
    updateRequest( corbelDriver, colName, query, data, options, domain ) {
      let curDomain = domain || corbelDriver.config.config.domain;

      if ( ( _.isObject(query) ) || options.multi) { //Update all documents in a collection
        return corbelDriver.domain(curDomain).resources.collection(colName).update(data, query);
      }
      else {
        return corbelDriver.domain(curDomain).resources.resource(colName, query).update(data); // The query is a document id
      }
    },

    remove( corbelDriver, collection, getParams ) {
      if (collection && getParams) {
        let future = new Future,
            query = QueryTranslator.query(getParams.selector),
            relation = QueryTranslator.relation(collection, getParams.options),
            distinct = QueryTranslator.distinct(getParams.distinct),
            domain = getParams.options.domain;

        _.extend(query, QueryTranslator.options(getParams.options), distinct);

        if (userActions.delete[collection]) {

          userActions.delete[collection](corbelDriver, query, domain, ( err, res ) => {
            if (err) {
              future.throw(err);
            }
            else {
              future.return(res);
            }
          }, getParams.options);

          return future.wait();
        }

      }
      else {
        if (!collection) {
          throw new TypeError('The second parameter must be a collection name');
        }

        if (!getParams) {
          throw new TypeError('The third parameter must be a valid get params object');
        }
      }
    },

    distinct( corbelDriver, collection, getParams, distinct ) {
      getParams.distinct = distinct;

      return this.get(corbelDriver, collection, getParams);
    },

    count( corbelDriver, collection, getParams ) {
      if (collection && getParams) {

        let future = new Future,
            relation = QueryTranslator.relation(collection, getParams.options),
            query = QueryTranslator.query(getParams.selector),
            domain = getParams.options.domain;

        _.extend(query, QueryTranslator.options(getParams.options));

        _.extend(query, QueryTranslator.count(getParams.options));

        if (userActions.get[collection]) {
          userActions.get[collection](corbelDriver, query, domain, ( err, res ) => {
            if (err) {
              future.throw(err);
            }
            else {
              future.return(res.count);
            }
          });

          return future.wait();
        }

        CorbelHandler
        .getRequest(corbelDriver, relation, query, domain)
        .then(( res ) => {
            if (res && res.data) {
              future.return(res.data.count);
            }
          })
        .catch(( e ) => {
          future.throw(parseCorbelError(e));
        });

        return future.wait();
      }
      else {

        if (!collection) {
          throw new TypeError('The second parameter must be a collection name');
        }

        if (!getParams) {
          throw new TypeError('The third parameter must be a valid get params object');
        }
      }
    }
  };
