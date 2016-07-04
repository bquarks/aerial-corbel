const operators = ['$eq', '$gt', '$gte', '$lt', '$lte', '$ne', '$in', '$nin', '$regex', '$elemMatch'],
    conditionals = ['$or'],
    _sort = { '-1': 'desc', 1: 'asc' },
    opTranslations = {
    $regex: '$like',
    $elemMatch: '$elem_match'
},
    updateOp = '$set',
    unsupportedUpdateOp = ['$inc', '$mul', '$rename', '$setOnInsert', '$unset', '$min', '$max', '$currentDate'],
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

function isGenericOp(fieldName) {
    return fieldName[0] === '$';
}

function hasGenericOps(dict) {
    let hasOp = false;

    for (let propName in dict) {
        hasOp = isGenericOp(propName);

        if (hasOp)
          return hasOp;
    }

    return hasOp;
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
    if (op === '$elem_match') {
        qObj[op][field] = [queryWalker(value).query[0]];
        //   qObj[field] = {};
    //   qObj[field][op] = queryWalker(value).query[0];
    }
    else {
        qObj[op][field] = value;
    }

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
    return { distinct: distinct };
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

function isUnsupportedUpdateOp (modifier) {
    for (let op in unsupportedUpdateOp) {
        if (modifier[op]) {
            return true;
        }
    }

    return false;
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

    getUpdateModifier: function (modifier) {
        if (modifier[updateOp]) {
          return modifier[updateOp];
        }
        else if (hasGenericOps(modifier)) {
          throw Meteor.Error('The modifier is not supported for update methods.');
        }
        else {
          return modifier;
        }
    },

    options: function (opt) {
      let skip = null,
          options = {};

      if (opt.skip || opt.limit) {

        opt.skip = opt.skip || 0;

        skip = parseInt(opt.skip / opt.limit);

        skip = isNaN(skip) ? 0 : skip;

        options = { pagination: { page:skip, pageSize: opt.limit } };
      }

      if (opt.sort) {
        let newSort = transformSort(opt.sort);
        if (Object.keys(newSort).length !== 0) {
          options.sort = newSort;
        }
      }

      if (opt.search) {
        options.search = opt.search;
      }

      return options;
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
