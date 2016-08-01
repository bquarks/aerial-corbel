let success = function onSuccess(res) {
  if (res.data || ( res.status >= 200 && res.status < 300 ) ) {
    this.fn(null, res.data);
  }
  else {
    this.fn('No data');
  }
};

userActions = {
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

  update: {
    corbelUsers: function getUserData(corbelDriver, query, domain, data, fn) {
      domain = domain || corbelDriver.config.config.domain;

      if (typeof query !== 'string') {
        fn('Wrong query');
        return;
      }

      corbelDriver.domain(domain).iam.user(query).update(data)
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
    },

    assets: function deleteAsset(corbelDriver, query, domain, fn) {
      if (!query && !query.query[0] && !query.query[0].$eq && !query.query[0].$eq._id) {
        fn('Wrong query');
        return;
      }

      corbelDriver.assets.asset(query.query[0].$eq._id).delete()
        .then(() => {
          fn(null, 1);
        })
        .catch(err => {
          fn(err);
        });
    },

    paymentPlan: function deletePaymentPlan(corbelDriver, query, domain, fn) {
      if (!query && !query.query[0] && !query.query[0].$eq && !query.query[0].$eq._id) {
        fn('Wrong query');
        return;
      }

      corbelDriver.ec.paymentPlan().delete(query.query[0].$eq._id)
        .then(() => {
          fn(null, 1);
        })
        .catch(err => {
          fn(err);
        });
    }
  },
};
