var operators = ['$eq', '$gt', '$gte', '$lt', '$lte', '$ne', '$in', '$nin', '$regex'],
    opTranslations = {
      $regex: '$like'
    };

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
    if (operators[i] === field) {
      return true;
    }
  }

  return false;
}

function getOperator(op) {
  let valid = opTranslations[op];
  if (valid) {
    return valid;
  }

  return op;
}

function translateOperator(op, field, value) {
  let qObj = {};

  op = getOperator(op);

  qObj[op] = {};

  // TODO: translate the operator in a specific form, some of them could need arrays or other objects
  qObj[op][field] = value;

  return qObj;
}

function queryWalker(selectors, field) {
  let query = [];
  for (var propName in selectors) {
    if (selectors.hasOwnProperty(propName)) {
      let val = selectors[propName];
      if (typeof val !== 'object' && !field) {
        let q = isEq(propName, val);

        if (q) {
          query.push(q);
        }
      } else if (field){
        // NOTE: search operators
        if (isOp(propName)) {
          let q = translateOperator(propName, field, val);
          return q;
        }
      }
      else {
        let q = queryWalker(val, propName);

        if (q) {
          query.push(q);
        }
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

      let skip = parseInt(opt.skip / opt.limit);

      skip = skip === NaN ? 0 : skip;

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
