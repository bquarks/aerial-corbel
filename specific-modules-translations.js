let success = function onSuccess(res) {
  console.log('success');
  console.log(res.data);
  if (res.data || ( res.status >= 200 && res.status < 300 ) ) {
    console.log('calling fn: ', JSON.stringify(this.fn));
    console.log(typeof this.fn);

    this.fn(null, res.data);
  }
  else {
    this.fn('No data');
  }
};

let getDomain = function getDomain(domain, driver) {
  domain = domain || driver.config.config.domain;

  return driver.domain(domain);
};

let getField = function getField(query, field) {
  if (!query && !query.query[0] && !query.query[0].$eq && !query.query[0].$eq[field || '_id']) {
    return false;
  }

  return query.query[0].$eq[field || '_id'];
};

let checkId = function checkId(query, fn) {
  let id = getField(query);

  if (!id) {
    fn('Wrong query');
    return false;
  }

  return id;
};

let handlePromise = function handlePromise(promise, fn) {
  promise
    .then(success.bind({ fn:fn }))
    .catch(err => {
      console.log('error');
      console.dir(err);
      fn(err);
    });
};

userActions = {
  get: {
    corbelUsers: function getUserData(corbelDriver, query, domain, fn) {
      handlePromise(
        getDomain(domain, corbelDriver).iam.users().get(query),
        fn
      );
    },

    assets: function getAssets(corbelDriver, query, domain, fn) {
      handlePromise(
        corbelDriver.assets.asset('all').get(query),
        fn
      );
    },

    payment: function getPayment(corbelDriver, query, domain, fn) {
      handlePromise(
        corbelDriver.ec.payment().getAll(query),
        fn
      );
    },

    paymentPlan: function getPaymentPlan(corbelDriver, query, domain, fn) {
      handlePromise(
        corbelDriver.ec.paymentPlan().getAll(query),
        fn
      );
    },

    paymentMethod: function getPaymentMethod(corbelDriver, query, domain, fn) {
      const id = getField(query, 'userId');

      if (!id) {
        fn('Wrong query');
      }

      handlePromise(
        corbelDriver.ec.paymentMethod().get(id),
        fn
      );
    },

    products: function getProduct(corbelDriver, query, domain, fn) {
      handlePromise(
        corbelDriver.ec.product().getAll(query),
        fn
      );
    },

    devices: function getDevices(corbelDriver, query, domain, fn, options) {

      domain = getDomain(domain, corbelDriver);
      if (!options || !options.deviceuid) {
        fn(null, []);
        return;
      }

      handlePromise(
        domain.iam.user(options.deviceuid).getDevices(),
        fn
      );
    }
  },

  update: {
    user: function getUserData(corbelDriver, query, domain, data, fn) {
      domain = getDomain(domain, corbelDriver);

      if (typeof query !== 'string') {
        fn('Wrong query');
        return;
      }

      corbelDriver.on('request', function (req) {
        console.log('request');
        console.dir(req);
      });

      // domain.iam.user(query).update(data).then(function () {
      //   console.log('success');
      // });

      handlePromise(
        domain.iam.user(query).update(data),
        fn
      );
    }
  },

  delete: {
    devices: function deleteDevice(corbelDriver, query, domain, fn, options) {
      domain = getDomain(domain, corbelDriver);
      if (!options || !options.userId) {
        fn(null, 0);
        return;
      }

      let uid = getField(query, 'uid');

      if (!uid) {
        return;
      }

      corbelDriver.on('request', function (req) {
        console.log('request');
        console.dir(req);
      });

      handlePromise(
        domain.iam.user(options.userId).deleteDevice(uid),
        fn
      );
    },

    assets: function deleteAsset(corbelDriver, query, domain, fn) {
      let id = checkId(query);

      if (!id) {
        return;
      }

      handlePromise(
        corbelDriver.assets.asset(id).delete(id),
        fn
      );
    },

    paymentPlan: function deletePaymentPlan(corbelDriver, query, options, fn) {
      let id = getField(query, '_id');

      if (!id) {
        console.log('not payment plan id');
        return;
      }

      corbelDriver.on('request', function (req) {
        console.dir(req);
      });

      console.log('plan id: ', id);

      handlePromise(
        corbelDriver.ec.paymentPlan().delete(id),
        fn
      );
    }
  },
};
