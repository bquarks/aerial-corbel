var Corbel = Npm.require('corbel-js'),
    path = Npm.require('path'),
    Fiber = Npm.require('fibers'),
    Future = Npm.require(path.join('fibers', 'future')),
    clientConfig = null,
    CHInstance = null;

class CorbelHandler {
  constructor (corbelDriver) {
    this.corbelDriver = corbelDriver;
  }

  request (relation, query) {
    // TODO: avoid repeat the first methods
    if (relation.method === 'relation') {
      return this.corbelDriver.domain('booqs').resources[relation.method](relation.from, relation.field, relation.to).get(null, query);
    }
    else {
      return this.corbelDriver.domain('booqs').resources[relation.method](relation.name).get(query);
    }
  }

  get (collection, getParams) {
    if (token && collection && getParams) {

      let future = new Future,
          query = QueryTranslator.query(getParams.selector),
          relation = QueryTranslator.relation(collection, getParams.options),
          distinct = QueryTranslator.distinct(getParams.distinct);

      _.extend(query, QueryTranslator.options(getParams.options), distinct);

      this.request(relation, query)
      .then((res) => {
        if (res && res.data) {
          future.return(res.data);
        }
      })
      .catch((e) => {
        console.error(e);
        throw e;
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

  insert (collection, doc) {
    // TODO: this couldn't be necesary
  }

  update (collection, data, condition) {
    // TODO
  }

  remove (collection, data, query) {
    // TODO
  }

  distinct (collection, getParams, distinct) {
    getParams.distinct = distinct;

    let docs = this.get(collection, getParams),
        values = [];

    for (var i = 0; i < docs.length; i++) {
      values.push(docs[i][distinct]);
    }

    return values;
  }

  count (collection, getParams) {
    if (collection && getParams) {

      let future = new Future,
          query = QueryTranslator.query(getParams.selector);

      _.extend(query, QueryTranslator.options(getParams.options));

      _.extend(query, QueryTranslator.count(getParams.options));

      this.corbelDriver.domain('booqs').resources
      .collection(collection).get(query)
      .then((res) => {
        if (res && res.data) {
          future.return(res.data.count);
        }
      })
      .catch((e) => {
        console.error(e);
        throw e;
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

CorbelSingleton = function (conf) {
  if (!CHInstance) {
    CHInstance = new CorbelHandler(conf);
  }

  return CHInstance;
};

CorbelHandler = function (corbelDriver) {
  return new CorbelHandler(corbelDriver);
};
