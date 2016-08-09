let success = function onSuccess(res) {
  console.log(res.data);
  if (res.data || ( res.status >= 200 && res.status < 300 ) ) {
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

let getId = function getId(query, field) {
  if (!query && !query.query[0] && !query.query[0].$eq && !query.query[0].$eq[field || '_id']) {
    return false;
  }

  return query.query[0].$eq[field || '_id'];
};

let checkId = function checkId(query, fn) {
  let id = getId(query);

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
      console.log(err);
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
      const id = getId(query, 'userId');

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
    corbelUsers: function getUserData(corbelDriver, query, domain, data, fn) {
      domain = getDomain(domain, corbelDriver);

      if (typeof query !== 'string') {
        fn('Wrong query');
        return;
      }

      handlePromise(
        corbelDriver.domain(domain).iam.user(query).update(data),
        fn
      );
    }
  },

  delete: {
    devices: function deleteDevice(corbelDriver, query, domain, fn, options) {
      domain = getDomain(domain, corbelDriver);
      if (!options || !options.deviceuid) {
        fn(null, 0);
        return;
      }

      let id = checkId(query);

      if (!id) {
        return;
      }

      handlePromise(
        corbelDriver.domain(domain).iam.user(options.deviceuid).deleteDevice(id),
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

    paymentPlan: function deletePaymentPlan(corbelDriver, query, domain, fn) {
      let id = checkId(query);

      if (!id) {
        return;
      }

      handlePromise(
        corbelDriver.ec.paymentPlan().delete(id),
        fn
      );
    }
  },
};
