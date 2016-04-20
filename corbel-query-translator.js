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
    } else if (typeof selector === 'object') {
      return queryWalker(selector);
    } else {
      return {};
    }
  },
};
