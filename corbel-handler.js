var Corbel = Npm.require('corbel-js'),
    path = Npm.require('path'),
    Fiber = Npm.require('fibers'),
    Future = Npm.require(path.join('fibers', 'future')),
    clientConfig = null,
    CHInstance = null;

function getDriver(token) {
  return Corbel.getDriver({
    iamToken: token,
    domain: clientConfig.domain,
    urlBase: clientConfig.urlBase,
  });
}

function makeLogin(driver, claims, cb) {
  driver.iam.token().create(claims).then((res) => {
    cb(res);
  });
}

function request (token, relation, query) {
  // TODO: avoid repeat the first methods
  if (relation.method === 'relation') {
    return getDriver(token).domain('booqs').resources[relation.method](relation.from, relation.field, relation.to).get(null, query);
  }
  else {
    return getDriver(token).domain('booqs').resources[relation.method](relation.name).get(query);
  }
}

var CorbelHandler = function (conf) {
  let clientDiver = null,
      clientToken = null;

  clientConfig = conf;

  clientDriver = Corbel.getDriver(conf);

  makeLogin(clientDriver, undefined, (res) => {
    clientToken = res;
  });

  this.loginUserWithPassword = function (user, cb) {
    makeLogin(clientDriver, {
      claims: {
        'basic_auth.username': user.name,
        'basic_auth.password': user.password,
        scope: 'booqs:admin',
      },
    }, cb);
  };

  this.get = function (token, collection, getParams) {
    if (token && collection && getParams) {

      let future = new Future,
          query = QueryTranslator.query(getParams.selector),
          relation = QueryTranslator.relation(collection, getParams.options);

      _.extend(query, QueryTranslator.options(getParams.options));

      request(token, relation, query)
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
      if (!token) {
        throw new TypeError('The first parameter must be a valid token object');
      }

      if (!collection) {
        throw new TypeError('The second parameter must be a collection name');
      }

      if (!getParams) {
        throw new TypeError('The third parameter must be a valid get params object');
      }
    }
  };

  this.insert = function (token, collection, doc) {
    // TODO: this couldn't be necesary
  };

  this.update = function (token, collection, data, condition) {

  };

  this.count = function (token, collection, getParams) {
    if (token && collection && getParams) {

      let future = new Future,
          query = QueryTranslator.query(getParams.selector);

      _.extend(query, QueryTranslator.options(getParams.options));

      _.extend(query, QueryTranslator.count(getParams.options));

      getDriver(token).domain('booqs').resources
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
      if (!token) {
        throw new TypeError('The first parameter must be a valid token object');
      }

      if (!collection) {
        throw new TypeError('The second parameter must be a collection name');
      }

      if (!getParams) {
        throw new TypeError('The third parameter must be a valid get params object');
      }
    }
  };
};

CorbelSingleton = function (conf) {
  if (!CHInstance) {
    CHInstance = new CorbelHandler(conf);
  }

  return CHInstance;
};
