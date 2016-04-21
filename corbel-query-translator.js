var operators = ['$eq', '$gt', '$gte', '$lt', '$lte', '$ne', '$in', '$nin'];

function isEq(field, value) {
  if (typeof value !== 'object') {
    let q = { $eq:{} };

    q['$eq'][field] = value;

    return q;
  }

  return false;
}

function isOp(field) {
  for (var i = 0; i < operators.length; i++) {
    if (operators[i] === val) {
      return true;
    }
  }

  return false;
}

function translateOperator(op, field, value) {
  let q = [],
      qObj = {};

  qObj[op] = {};

  // TODO: translate the operator in a specific form, some of them could need arrays or other objects
  qObj[op][field] = value;
  q.push(qObj);

  return q;
}

function queryWalker(selectors) {
  let query = [];
  for (var propName in selectors) {
    if (selectors.hasOwnProperty(propName)) {
      let val = selectors[propName];
      if (typeof val !== 'object') {
        let q = isEq(propName, val);

        if (q) {
          query.push(q);
        }
      } else {
        // NOTE: search operators
      }
    }
  }

  return { query: query };
}

QueryTranslator = {
  query: function (selector) {
    let query = null;
    if (typeof selector === 'string') {
      return { query: isEq('id', selector) };
    } else if (typeof selector === 'object' && Object.keys(selector).length !== 0) {
      return queryWalker(selector);
    } else {
      return {};
    }
  },

  options: function (opt) {
    if (opt.skip || opt.limit) {
      opt.skip = opt.skip || 0;

      let skip = parseInt(opt.limit / opt.skip) - 1;

      skip = skip === -1 ? 0 : skip;

      return { pagination: { page:skip, pageSize: opt.limit } };
    }
  },

  count: function (opt) {
    if (opt.field) {
      // TODO: count only the fields that have a 1 or true in the field object
      // with {$count: 'description'} corbel only count the docs that have this field.
    }

    return { aggregation: { $count: '*' } };
  },
};
