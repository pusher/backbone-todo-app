//     Backpusher.js 0.0.1
//     (c) 2011 Pusher.
//     Backpusher may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://github.com/pusher/backpusher

;(function(exports, undefined){
  // The top-level namespace. All public Backbone classes and modules will
  // be attached to this. Exported for both CommonJS and the browser.
  var Backpusher = function(channel, collection, options) {
    if (!(this instanceof Backpusher)) {
      return new Backpusher(channel, collection, options);
    }

    // Bind for the connection established, so
    // we can setup the socket_id param.
    channel.pusher.bind('pusher:connection_established', function() {
      Backbone.pusher_socket_id = channel.pusher.socket_id;
    });

    // Options is currently unused:
    this.options = (options || {});
    this.channel = channel;
    this.collection = collection;

    if (this.options.events) {
      this.events = this.options.events;
    } else {
      this.events = Backpusher.defaultEvents;
    }

    this._bindEvents();
    this.initialize(channel, collection, options);
  };

  _.extend(Backpusher.prototype, {
    initialize: function() {},

    _bindEvents: function() {
      if (!this.events) return;

      for (var event in this.events) {
        this.channel.bind(event, _.bind(this.events[event], this));
      }
    },

    _add: function(model) {
      var Collection = this.collection;
      model = new Collection.model(model);

      return Collection.add(model);
    }
  });

  Backpusher.defaultEvents = {
    created: function(pushed_model) {
      return this._add(pushed_model)
    },

    updated: function(pushed_model) {
      var model = this.collection.get(pushed_model);

      if (model) {
        return model.set(pushed_model);
      } else {
        return this._add(pushed_model);
      }
    },

    destroyed: function(pushed_model) {
      var model = this.collection.get(pushed_model);

      if (model) {
        return this.collection.remove(model);
      }
    }
  };

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'delete': 'DELETE',
    'read'  : 'GET'
  };

  // Backpusher's Backbone.sync method:
  // -------------
  Backbone.sync = function(method, model, success, error) {
    var type = methodMap[method];
    var modelJSON = null;

    if (method === 'create' || method === 'update') {
      modelJSON = JSON.stringify(model.toJSON());
    }

    if (!(model && model.url)) {
      throw new Error("A 'url' property or function must be specified");
    }

    var modelUrl = _.isFunction(model.url) ? model.url() : model.url;
    modelUrl += '?socket_id=' + Backbone.pusher_socket_id;

    // Default JSON-request options.
    var params = {
      url:          modelUrl,
      type:         type,
      contentType:  'application/json',
      data:         modelJSON,
      dataType:     'json',
      processData:  false,
      success:      success,
      error:        error
    };

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (Backbone.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.processData = true;
      params.data        = modelJSON ? {model : modelJSON} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (Backbone.emulateHTTP) {
      if (type === 'PUT' || type === 'DELETE') {
        if (Backbone.emulateJSON) params.data._method = type;
        params.type = 'POST';
        params.beforeSend = function(xhr) {
          xhr.setRequestHeader("X-HTTP-Method-Override", type);
        };
      }
    }

    // Make the request.
    $.ajax(params);
  };

  // Export:
  exports.Backpusher = Backpusher;
})((typeof exports !== 'undefined' ? exports : this));