'use strict';

const jQueryDeferred = require('jquery-deferred');
const jQueryParam = require('jquery-param');

const jqueryFunction = function(subject) {
  const getEvents = () => subject.events || {};

  if (subject && subject === subject.window) {
    return {
      0: subject,
      load: handler => subject.addEventListener("load", handler, false),
      bind: (event, handler) => subject.addEventListener(event, handler, false),
      unbind: (event, handler) => subject.removeEventListener(event, handler, false),
    };
  }

  return {
    0: subject,
    unbind(event, handler) {
      const events = getEvents();
      let handlers = events[event] || [];

      if (handler) {
        const idx = handlers.indexOf(handler);
        if (idx !== -1) {
          handlers.splice(idx, 1);
        }
      } else {
        handlers = [];
      }

      events[event] = handlers;
      subject.events = events;
    },
    bind(event, handler) {
      const events = getEvents();
      const current = events[event] || [];
      events[event] = current.concat(handler);
      subject.events = events;
    },
    triggerHandler(event, args) {
      const events = getEvents();
      const handlers = events[event] || [];
      const target = this[0];

      handlers.forEach(fn => {
        if (args === undefined) {
          args = {
            type: event,
            target: target
          };
        }
        if (!Array.isArray(args)) {
          args = [args];
        }
        if (
          args &&
          args[0] &&
          args[0].type === undefined &&
          args[0].target === undefined
        ) {
          args = [
            {
              type: event,
              target: target
            },
          ].concat(args || []);
        } else {
          args = args || [];
        }

        fn.apply(this, args);
      });
    },
  };
};

const xhr = function() {
  try {
    return new window.XMLHttpRequest();
  } catch (e) {}
};

const qs = data => {
  let results = [];
  for (const name in data)
    results.push(`${name}=${encodeURIComponent(data[name])}`);
  return results.join('&');
};

const ajax = function(options) {
  const request = xhr();
  let aborted = false;

  request.onreadystatechange = () => {
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
    Object.keys(options.xhrFields).forEach(key => {
      const value = options.xhrFields[key];
      request[key] = value;
    });
  }

  request.send(
    options.type === 'POST' ? options.data && qs(options.data) : undefined
  );

  return {
    abort: function(reason) {
      aborted = true;
      return request.abort(reason);
    }
  };
};

module.exports = jQueryDeferred.extend(
  jqueryFunction,
  jQueryDeferred,
  {
    defaultAjaxHeaders: null,
    ajax: ajax,
    inArray: (arr,item) => arr.indexOf(item) !== -1,
    trim: str => str && str.trim(),
    isEmptyObject: obj => !obj || Object.keys(obj).length === 0,
    makeArray: arr => [].slice.call(arr,0),
    param: jQueryParam,
    support: {
      cors: (function() {
        const xhrObj = xhr();
        return !!xhrObj && ("withCredentials" in xhrObj);
      })()
    }
  })

