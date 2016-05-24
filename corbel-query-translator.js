const operators = ['$eq', '$gt', '$gte', '$lt', '$lte', '$ne', '$in', '$nin', '$regex'],
    conditionals = ['$or'],
    _sort = {'-1': 'desc', '1': 'asc'},
    opTranslations = {
      $regex: '$like'
    },
    condTranslations = {
      $or: 'queries',
      nothing: 'query'
    };

function isEq(field, value) {
  if (typeof value !== 'object') {
    let q = { $eq:{} };

    q['$eq'][field] = value;

    return q;
  }

  return false;
}

function lookDict(field, dict) {
  for (var i = 0; i < dict.length; i++) {
    if (dict[i] === field) {
      return true;
    }
  }

  return false;
}

function isOp(field) {
  return lookDict(field, operators);
}

function isConditional(op) {
  return lookDict(op, conditionals);
}

function transformSort(sort) {
  for (var field in sort) {
    if (sort.hasOwnProperty(field)) {
      let val = sort[field];
      sort[field] = typeof val === 'number' || val === '1' || val === '-1' ? _sort[val] : val;
    }
  }

  return sort;
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

function translateConditional(op) {
  let cond = condTranslations[op];

  if (cond) {
    return cond;
  }
  else {
    return condTranslations['nothing'];
  }
}

function translateDistinct (distinct) {
  return {distinct: distinct};
}

function queryWalker(selectors, field) {
  let query = [],
      name;
  for (var propName in selectors) {
    if (selectors.hasOwnProperty(propName)) {
      let val = selectors[propName];

      name = translateConditional(propName);

      if (typeof val !== 'object' && !field) {
        let q = isEq(propName, val);

        if (q) {
          query.push(q);
        }
      }
      else if (isConditional(propName)) {
        for (var i = 0; i < val.length; i++) {
          query.push(queryWalker(val[i]));
        }
      }
      else if (field){
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
  let ret = {};
  ret[name] = query;
  return ret;
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
    let skip = null,
        options = {};

    if (opt.skip || opt.limit) {

      opt.skip = opt.skip || 0;

      skip = parseInt(opt.skip / opt.limit);

      skip = skip === NaN ? 0 : skip;

      options = { pagination: { page:skip, pageSize: opt.limit } };
    }

    if (opt.sort) {
      let newSort = transformSort(opt.sort);
      if (Object.keys(newSort).length !== 0) {
        options.sort = newSort;
      }
    }

    return options
  },

  count: function (opt) {
    if (opt.field) {
      // TODO: count only the fields that have a 1 or true in the field object
      // with {$count: 'description'} corbel only count the docs that have this field.
    }

    return { aggregation: { $count: '*' } };
  },

  relation: function (collName, opt) {
    if (collName.indexOf('.') !== -1 && opt.relation) {
      let names = collName.split('.');
      return {
        method: 'relation',
        from: names[0],
        to: names[1],
        field: opt.relation
      };
    }
    else {
      return {
        method: 'collection',
        name: collName
      }
    }
  },

  distinct: function (distinct) {
    return translateDistinct(distinct);
  }
};
