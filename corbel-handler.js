/* jshint esversion: 6 */
var Corbel = Npm.require('corbel-js'),
    path = Npm.require('path'),
    Future = Npm.require(path.join('fibers', 'future')),
    clientConfig = null,
    CHInstance = null;

CorbelHandler = {

  getRequest (corbelDriver, relation, query, domain) {
    // TODO: avoid repeat the first methods

    let curDomain = domain || corbelDriver.config.config.domain;

    if (relation.method === 'relation') {
      return corbelDriver.domain(curDomain).resources[relation.method](relation.from, relation.field, relation.to).get(null, query);
    }
    else {
      return corbelDriver.domain(curDomain).resources[relation.method](relation.name).get(query);
    }
  },

  get (corbelDriver, collection, getParams) {
    if (collection && getParams) {

      let future = new Future,
          query = QueryTranslator.query(getParams.selector),
          relation = QueryTranslator.relation(collection, getParams.options),
          distinct = QueryTranslator.distinct(getParams.distinct);

      _.extend(query, QueryTranslator.options(getParams.options), distinct);

      CorbelHandler
      .getRequest(corbelDriver, relation, query)
      .then((res) => {
        if (res && res.data) {
          future.return(res.data);
        }
      })
      .catch((e) => {
        console.log('CORBEL COLLECTION GET ERROR');
        future.throw(e);
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

  insert (corbelDriver, collection, doc) {
    // TODO: this couldn't be necesary
  },

  update (corbelDriver, collectionName, getParams) {

    if (collectionName && getParams) {
      let future = new Future,
          options = getParams.options,
          mod = getParams.mod,
          selector = getParams.selector;

      CorbelHandler
      .updateRequest(corbelDriver, collectionName, selector._id, mod, options)
      .then((res) => {
        if (res) {
          console.log('Updated!');
          future.return(res.data);
        }
      })
      .catch((e) => {

        console.log('update Failed');
        future.throw(e);
      });

      return future.wait();
    }else {
      if (!collectionName) {
        throw new TypeError('The second parameter must be a collection name.');
      }
      if (!getParams) {
        throw new TypeError('The third parameter must be a valid get params object');
      }
    }
  },

  updateRequest(corbelDriver, colName, id, mod, options) {
    let curDomain = corbelDriver.config.config.domain;

    if (options.multi) { //Update all documents in a collection
      return corbelDriver.domain(curDomain).resources.collection(colName).update(mod, selector);
    }
    else {
      return corbelDriver.domain(curDomain).resources.resource(colName, id).update(mod);
    }
  },

  remove (corbelDriver, collection, data, query) {
    // TODO
  },

  distinct (corbelDriver, collection, getParams, distinct) {
    getParams.distinct = distinct;

    let docs = this.get(corbelDriver, collection, getParams),
        values = [];

    for (var i = 0; i < docs.length; i++) {
      values.push(docs[i][distinct]);
    }

    return values;
  },

  count (corbelDriver, collection, getParams) {
    if (collection && getParams) {

      let future = new Future,
          relation = QueryTranslator.relation(collection, getParams.options),
          query = QueryTranslator.query(getParams.selector);

      _.extend(query, QueryTranslator.options(getParams.options));

      _.extend(query, QueryTranslator.count(getParams.options));

      CorbelHandler
      .getRequest(corbelDriver, relation, query)
      .then((res) => {
        if (res && res.data) {
          future.return(res.data.count);
        }
      })
      .catch((e) => {
        future.throw(e);
      });

      return future.wait();
    } else {

      if (!collection) {
        throw new TypeError('The second parameter must be a collection name');
      }

      if (!getParams) {
        throw new TypeError('The third parameter must be a valid get params object');
      }
    }
  }
};
