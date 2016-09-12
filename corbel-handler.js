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
            // Meteor.call('elephantInvalidate', getParams.options.MD5);
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

    insert( corbelDriver, collection, doc, domain ) {
      let curDomain = domain || corbelDriver.config.config.domain,
          future = new Future;

      corbelDriver.domain(domain).resources.collection(collection).add(doc)
        .then(res => {
          console.log('inserted');
          if (res && res.data) {
            future.return(res.data);
          }
          else {
            future.return(res);
          }
        })
        .catch(e => {
          console.log('error on inserted');
          console.dir(e);
          future.throw(parseCorbelError(e));
        });

      return future.wait();
    },

    update( corbelDriver, collectionName, params ) {
      if (collectionName && params) {

        let future = new Future,
            options = params.options,
            domain = options.domain,
            data = QueryTranslator.getUpdateModifier(params.modifier),
            query = QueryTranslator.getUpdateQuery(params.selector, options);

        if (userActions.update[collectionName]) {
          userActions.update[collectionName](corbelDriver, query, domain, data, ( err, res ) => {
            if (err) {
              future.throw(err);
            }
            else {
              // Meteor.call('elephantUpdate', params.selector, params.modifier, params.options);
              future.return(res);
            }
          }, params.options);

          return future.wait();
        }
        else {
          CorbelHandler
          .updateRequest(corbelDriver, collectionName, query, data, options, domain)
          .then(( res ) => {
            if (res) {
              console.log('success');
              // Meteor.call('elephantUpdate', params.selector, params.modifier, params.options);
              future.return(res.data);
            }
          })
          .catch(( e ) => {
            future.throw(parseCorbelError(e));
          });

          return future.wait();
        }
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
            domain = getParams.options && getParams.options.domain;

        _.extend(query, QueryTranslator.options(getParams.options), distinct);
        if (userActions.delete[collection]) {

          userActions.delete[collection](corbelDriver, query, domain, ( err, res ) => {
            if (err) {
              future.throw(err);
            }
            else {
              // Meteor.call('elephantUpdate', getParams.selector, {}, getParams.options, true);
              future.return(res);
            }
          }, getParams.options);

          return future.wait();
        }
        else {
          if (!getParams.options.multi) {
            query = query.query[0].$eq._id;
          }
          CorbelHandler
          .removeRequest(corbelDriver, collection, query, getParams.options, domain)
          .then(( res ) => {
            if (res) {
              // Meteor.call('elephantUpdate', params.selector, params.modifier, params.options);
              console.log('success removing');
              future.return();
            }
          })
          .catch(( e ) => {
            console.log('error removing');
            future.throw(parseCorbelError(e));
          });

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

    removeRequest: function ( corbelDriver, colName, query, options, domain ) {
      let curDomain = domain || corbelDriver.config.config.domain;

      if ( ( _.isObject(query) ) || options.multi) { //Update all documents in a collection
        return corbelDriver.domain(curDomain).resources.collection(colName).delete(query);
      }
      else {
        return corbelDriver.domain(curDomain).resources.resource(colName, query).delete(); // The query is a document id
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
