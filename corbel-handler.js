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
          distinct = QueryTranslator.distinct(getParams.distinct),
					domain = getParams.options.domain;

      _.extend(query, QueryTranslator.options(getParams.options), distinct);

      CorbelHandler
      .getRequest(corbelDriver, relation, query, domain)
      .then((res) => {
        if (res && res.data) {
          future.return(res.data);
        }
      })
      .catch((e) => {
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

  update (corbelDriver, collectionName, params) {
    if (collectionName && params) {
      let future = new Future,
          options = params.options,
          domain = options.domain,
          data = QueryTranslator.getUpdateModifier(params.modifier),
          query = !params.selector._id && !params.selector.id ? QueryTranslator.query(params.selector) : params.selector._id || params.selector.id;

      CorbelHandler
      .updateRequest(corbelDriver, collectionName, query, data, options, domain)
      .then((res) => {
        if (res) {
          future.return(res.data);
        }
      })
      .catch((e) => {
        future.throw(e);
      });

      return future.wait();
    }else {
      if (!collectionName) {
        throw new TypeError('The second parameter must be a collection name.');
      }
      if (!params) {
        throw new TypeError('The third parameter must be a valid get params object');
      }
    }
  },

  updateRequest(corbelDriver, colName, query, data, options, domain) {
    let curDomain = domain || corbelDriver.config.config.domain;

    if ( ( _.isObject(query) ) || options.multi) { //Update all documents in a collection
      return corbelDriver.domain(curDomain).resources.collection(colName).update(data, query);
    }
    else {
      return corbelDriver.domain(curDomain).resources.resource(colName, query).update(data); // The query is a document id
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
          query = QueryTranslator.query(getParams.selector),
					domain = getParams.options.domain;

      _.extend(query, QueryTranslator.options(getParams.options));

      _.extend(query, QueryTranslator.count(getParams.options));

      CorbelHandler
      .getRequest(corbelDriver, relation, query, domain)
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
