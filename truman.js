// Generated by CoffeeScript 1.6.1
(function() {
  var DB, Route, Table, afterDelay, api, chop, clobberProperty, clone, compact, endsWith, filter, getDelay, lastChar, merge, parseData, pluralize, singularize, startsWith, _addEventListener, _getAllResponseHeaders, _open, _send, _setRequestHeader;

  api = {
    index: function(tableName, options) {
      var callback;
      if (options == null) {
        options = {};
      }
      callback = options.callback || function() {};
      return afterDelay(getDelay(), function() {
        var foreignKeyField, rows;
        rows = Table(tableName).rows();
        if (options.foreignTableName != null) {
          foreignKeyField = singularize(options.foreignTableName) + '_id';
          rows = filter(rows, function(row) {
            return String(row[foreignKeyField]) === String(options.foreignKey);
          });
        } else {
          rows = api.joinRowsWithAssociations(rows);
        }
        return callback(rows);
      });
    },
    get: function(tableName, recordId, callback) {
      return afterDelay(getDelay(), function() {
        var row;
        row = Table(tableName).get(recordId);
        return callback(api.joinRowWithAssociations(row));
      });
    },
    update: function(tableName, recordId, data, contentType, callback) {
      if (typeof data === 'string') {
        data = parseData(data, contentType);
      }
      return afterDelay(getDelay(), function() {
        return callback(Table(tableName).update(recordId, data));
      });
    },
    create: function(tableName, data, options) {
      var callback, contentType;
      if (options == null) {
        options = {};
      }
      callback = options.callback || function() {};
      contentType = options.contentType || '';
      if (typeof data === 'string') {
        data = parseData(data, contentType);
      }
      return afterDelay(getDelay(), function() {
        var foreignKeyField;
        if (options.foreignTableName != null) {
          foreignKeyField = singularize(options.foreignTableName) + '_id';
          data = clone(data);
          data[foreignKeyField] = Number(options.foreignKey);
        }
        return callback(Table(tableName).insert(data));
      });
    },
    "delete": function(tableName, recordId, callback) {
      return afterDelay(getDelay(), function() {
        var record, table;
        table = Table(tableName);
        record = table.get(recordId);
        table["delete"](recordId);
        return callback(record);
      });
    },
    joinRowsWithAssociations: function(rows) {
      var joined, row, _i, _len;
      joined = [];
      for (_i = 0, _len = rows.length; _i < _len; _i++) {
        row = rows[_i];
        joined.push(api.joinRowWithAssociations(row));
      }
      return joined;
    },
    joinRowWithAssociations: function(row) {
      var id, joined, key, tableName;
      joined = {};
      for (key in row) {
        if (endsWith(key, '_id')) {
          id = row[key];
          key = chop(key, 3);
          tableName = pluralize(key);
          joined[key] = Table(tableName).get(id);
        } else {
          joined[key] = row[key];
        }
      }
      return joined;
    }
  };

  Route = (function() {

    function Route(method, url) {
      var parts;
      this.method = method.toUpperCase();
      parts = compact(url.split('/'));
      this.tableName = parts.length > 2 ? parts[2] : parts[0];
      if (parts.length > 1) {
        this.recordId = parts[1];
      }
      if (parts.length > 2) {
        this.foreignTableName = parts[0];
      }
    }

    Route.prototype.call = function(data, contentType, callback) {
      switch (this.method) {
        case 'GET':
          return this.get(callback);
        case 'POST':
          return this.post(data, contentType, callback);
        case 'DELETE':
          return this["delete"](callback);
      }
    };

    Route.prototype.get = function(callback) {
      if (this.foreignTableName) {
        return api.index(this.tableName, {
          foreignTableName: this.foreignTableName,
          foreignKey: this.recordId,
          callback: callback
        });
      } else if (this.recordId) {
        return api.get(this.tableName, this.recordId, callback);
      } else {
        return api.index(this.tableName, {
          callback: callback
        });
      }
    };

    Route.prototype.post = function(data, contentType, callback) {
      if (this.foreignTableName) {
        return api.create(this.tableName, data, {
          foreignTableName: this.foreignTableName,
          foreignKey: this.recordId,
          contentType: contentType,
          callback: callback
        });
      } else if (this.recordId) {
        return api.update(this.tableName, this.recordId, data, contentType, callback);
      } else {
        return api.create(this.tableName, data, {
          contentType: contentType,
          callback: callback
        });
      }
    };

    Route.prototype["delete"] = function(callback) {
      return api["delete"](this.tableName, this.recordId, callback);
    };

    return Route;

  })();

  DB = {
    getOrCreateTable: function(name) {
      var table, _base, _ref;
      return table = ((_ref = (_base = DB.tables)[name]) != null ? _ref : _base[name] = new Table(name));
    },
    tables: {}
  };

  Table = (function() {

    function Table(name) {
      if (!(this instanceof Table)) {
        return DB.getOrCreateTable(name);
      }
      this.name = name;
      this.data = JSON.parse(localStorage[this._prefixedName()] || '{}');
      if (this.data.name == null) {
        this.data.name = this.name;
        this.data.rows = [];
        this.save();
      }
    }

    Table.prototype.name = function() {
      return this.data.name;
    };

    Table.prototype.rows = function() {
      return this.data.rows;
    };

    Table.prototype.get = function(id) {
      return this.data.rows[id - 1];
    };

    Table.prototype.insert = function(data) {
      var record;
      record = this._addRecord(data);
      this.save();
      return record;
    };

    Table.prototype.insertMany = function(data) {
      var record, records;
      records = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          record = data[_i];
          _results.push(this._addRecord(record));
        }
        return _results;
      }).call(this);
      this.save();
      return records;
    };

    Table.prototype.update = function(id, data) {
      var record;
      record = this._updateRecord(id, data);
      this.save();
      return record;
    };

    Table.prototype.updateMany = function(data) {
      var recordId, records;
      records = (function() {
        var _results;
        _results = [];
        for (recordId in data) {
          _results.push(this._updateRecord(recordId, data[recordId]));
        }
        return _results;
      }).call(this);
      this.save();
      return records;
    };

    Table.prototype["delete"] = function(id) {
      return this.data.rows[id + 1] = void 0;
    };

    Table.prototype.save = function() {
      return localStorage[this._prefixedName()] = JSON.stringify(this.data);
    };

    Table.prototype.drop = function() {
      delete DB.tables[this.name];
      return delete localStorage[this._prefixedName()];
    };

    Table.prototype._addRecord = function(data) {
      var record;
      record = merge(data, {
        id: this._getNextId()
      });
      this.data.rows.push(record);
      return record;
    };

    Table.prototype._updateRecord = function(id, data) {
      var record;
      record = merge(this.get(id), data);
      this.data.rows[id + 1] = record;
      return record;
    };

    Table.prototype._getNextId = function() {
      return this.data.rows.length + 1;
    };

    Table.prototype._prefixedName = function() {
      return "__truman__" + this.name;
    };

    return Table;

  })();

  window.Truman = {
    Table: Table,
    dropTables: function() {
      var otherTables, table, tableName, _i, _len, _results;
      for (tableName in DB.tables) {
        Table(tableName).drop();
      }
      otherTables = filter(Object.keys(localStorage), function(key) {
        return startsWith(key, '__truman__');
      });
      _results = [];
      for (_i = 0, _len = otherTables.length; _i < _len; _i++) {
        table = otherTables[_i];
        tableName = table.substring('__truman__'.length);
        _results.push(Table(tableName).drop());
      }
      return _results;
    },
    delay: 1000
  };

  getDelay = function() {
    return Truman.delay;
  };

  _open = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function(method, url) {
    this.route = new Route(method, url);
    return this.requestHeaders = {};
  };

  _send = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.send = function(data) {
    var _this = this;
    return this.route.call(data, this.requestHeaders['content-type'], function(result) {
      var handler, listener, listeners, _i, _len, _results;
      clobberProperty(_this, 'status', 200);
      clobberProperty(_this, 'readyState', 4);
      clobberProperty(_this, 'responseText', JSON.stringify(result));
      handler = _this.onload || _this.onprogress || _this.onreadystatechange;
      if (handler != null) {
        return handler();
      } else {
        listeners = _this.interceptors && (_this.interceptors['load'] || _this.interceptors['progress']) || [];
        _results = [];
        for (_i = 0, _len = listeners.length; _i < _len; _i++) {
          listener = listeners[_i];
          _results.push(listener());
        }
        return _results;
      }
    });
  };

  _addEventListener = XMLHttpRequest.prototype.addEventListener;

  XMLHttpRequest.prototype.addEventListener = function(name, listener) {
    var _base, _ref, _ref1;
    if ((_ref = this.interceptors) == null) {
      this.interceptors = {};
    }
    if ((_ref1 = (_base = this.interceptors)[name]) == null) {
      _base[name] = [];
    }
    this.interceptors[name].push(listener);
    return _addEventListener.apply(this, arguments);
  };

  _setRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
    try {
      this.requestHeaders[name.toLowerCase()] = value;
      return _setRequestHeader.apply(this, arguments);
    } catch (e) {

    }
  };

  _getAllResponseHeaders = XMLHttpRequest.prototype.getAllResponseHeaders;

  XMLHttpRequest.prototype.getAllResponseHeaders = function() {
    return ['Date: ' + new Date().toString(), 'content-length: ' + this.responseText.length, 'content-type: application/json; charset=UTF-8'].join('\n');
  };

  afterDelay = function(delay, callback) {
    return setTimeout(callback, delay);
  };

  merge = function(left, right) {
    var key, merged;
    merged = {};
    for (key in left) {
      merged[key] = left[key];
    }
    for (key in right) {
      merged[key] = right[key];
    }
    return merged;
  };

  clone = function(object) {
    return merge(object, {});
  };

  filter = function(array, predicate) {
    var filtered, value, _i, _len;
    filtered = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      value = array[_i];
      if (predicate(value)) {
        filtered.push(value);
      }
    }
    return filtered;
  };

  compact = function(array) {
    return filter(array, function(value) {
      return !!value;
    });
  };

  singularize = function(word) {
    if (endsWith(word, 'ies')) {
      return chop(word, 3) + 'y';
    }
    if (endsWith(word, 'es')) {
      return chop(word, 2);
    }
    if (lastChar(word) === 's') {
      return chop(word, 1);
    }
    return word;
  };

  pluralize = function(word) {
    if (lastChar(word) === 'y') {
      return chop(word, 1) + 'ies';
    }
    if (endsWith(word, 'es')) {
      return "" + word + "es";
    }
    return "" + word + "s";
  };

  lastChar = function(word) {
    return word.charAt(word.length - 1);
  };

  startsWith = function(word, prefix) {
    return word.substring(0, prefix.length) === prefix;
  };

  endsWith = function(word, suffix) {
    return word.substring(word.length - suffix.length) === suffix;
  };

  chop = function(word, length) {
    return word.substring(0, word.length - length);
  };

  parseData = function(encodedData, contentType) {
    var data, key, param, parameters, value, _i, _len, _ref;
    if (contentType === 'application/json') {
      return JSON.parse(encodedData);
    }
    data = {};
    parameters = encodedData.split('&');
    for (_i = 0, _len = parameters.length; _i < _len; _i++) {
      param = parameters[_i];
      _ref = param.split('='), key = _ref[0], value = _ref[1];
      key = decodeURIComponent(key);
      value = decodeURIComponent(value).replace(/\+/g, ' ');
      if (!(key in data)) {
        data[key] = value;
      } else if (!(data[key] instanceof Array)) {
        data[key] = [data[key], value];
      } else {
        data[key].push(value);
      }
    }
    return data;
  };

  clobberProperty = function(object, propertyName, value) {
    if (Object.defineProperty != null) {
      return Object.defineProperty(object, propertyName, {
        get: function() {
          return value;
        }
      });
    } else if (object.__defineGetter__ != null) {
      return object.__defineGetter__(propertyName, function() {
        return value;
      });
    } else {
      return object[propertyName] = value;
    }
  };

}).call(this);
