var Corbel = Npm.require('corbel-js'),
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

var CorbelHandler = function (conf) {
  let clientDiver = null,
      clientToken = null;

  clientConfig = conf;

  clientDriver = Corbel.getDriver(conf);

  makeLogin(clientDriver, undefined, (res) => {
    clientToken = res;
  });

  this.loginUserWithPassword = function (user, cb) {
    console.log('Login user');
    makeLogin(clientDriver, {
      claims: {
        'basic_auth.username': user.name,
        'basic_auth.password': user.password,
        scope: 'booqs:admin',
      },
    }, cb);
  };

  this.get = function (token, collection, getParams, cb) {
    if (token && collection && getParams && cb) {
      getDriver(token).domain('booqs').resources
        .collection(collection).get(getParams)
        .then((res) => {
          if (res && res.data) {
            cb(res.data);
          }
        })
        .catch((e) => {
          throw e;
        });
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

      if (!cb) {
        throw new TypeError('The four parameter must be a callback function');
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
