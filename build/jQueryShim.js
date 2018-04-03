'use strict';

var jQueryDeferred = require('jquery-deferred');
var jQueryParam = require('jquery-param');

var jqueryFunction = function jqueryFunction(subject) {
  var getEvents = function getEvents() {
    return subject.events || {};
  };

  if (subject && subject === subject.window) {
    return {
      0: subject,
      load: function load(handler) {
        return subject.addEventListener("load", handler, false);
      },
      bind: function bind(event, handler) {
        return subject.addEventListener(event, handler, false);
      },
      unbind: function unbind(event, handler) {
        return subject.removeEventListener(event, handler, false);
      }
    };
  }

  return {
    0: subject,
    unbind: function unbind(event, handler) {
      var events = getEvents();
      var handlers = events[event] || [];

      if (handler) {
        var idx = handlers.indexOf(handler);
        if (idx !== -1) {
          handlers.splice(idx, 1);
        }
      } else {
        handlers = [];
      }

      events[event] = handlers;
      subject.events = events;
    },
    bind: function bind(event, handler) {
      var events = getEvents();
      var current = events[event] || [];
      events[event] = current.concat(handler);
      subject.events = events;
    },
    triggerHandler: function triggerHandler(event, args) {
      var _this = this;

      var events = getEvents();
      var handlers = events[event] || [];
      handlers.forEach(function (fn) {
        if (args === undefined) {
          args = { type: event };
        }
        if (!Array.isArray(args)) {
          args = [args];
        }
        if (args && args[0] && args[0].type === undefined) {
          args = [{
            type: event
          }].concat(args || []);
        } else {
          args = args || [];
        }

        fn.apply(_this, args);
      });
    }
  };
};

var xhr = function xhr() {
  try {
    return new window.XMLHttpRequest();
  } catch (e) {}
};

var qs = function qs(data) {
  var results = [];
  for (var name in data) {
    results.push(name + '=' + encodeURIComponent(data[name]));
  }return results.join('&');
};

var ajax = function ajax(options) {
  var request = xhr();
  var aborted = false;

  request.onreadystatechange = function () {
    if (request.readyState !== 4 || aborted) {
      return;
    }

    if (request.status === 200 && !request._hasError && options.success) {
      try {
        options.success(JSON.parse(request.responseText));
      } catch (e) {
        options.error(request, e);
      }
    } else if (options.error) {
      options.error(request, request._response);
    }
  };

  request.open(options.type, options.url);
  request.setRequestHeader('content-type', options.contentType);

  if (options.xhrFields) {
    Object.keys(options.xhrFields).forEach(function (key) {
      var value = options.xhrFields[key];
      request[key] = value;
    });
  }

  request.send(options.type === 'POST' ? options.data && qs(options.data) : undefined);

  return {
    abort: function abort(reason) {
      aborted = true;
      return request.abort(reason);
    }
  };
};

module.exports = jQueryDeferred.extend(jqueryFunction, jQueryDeferred, {
  defaultAjaxHeaders: null,
  ajax: ajax,
  inArray: function inArray(arr, item) {
    return arr.indexOf(item) !== -1;
  },
  trim: function trim(str) {
    return str && str.trim();
  },
  isEmptyObject: function isEmptyObject(obj) {
    return !obj || Object.keys(obj).length === 0;
  },
  makeArray: function makeArray(arr) {
    return [].slice.call(arr, 0);
  },
  param: jQueryParam,
  support: {
    cors: function () {
      var xhrObj = xhr();
      return !!xhrObj && "withCredentials" in xhrObj;
    }()
  }
});