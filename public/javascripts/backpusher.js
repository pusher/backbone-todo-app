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

  // Export:
  exports.Backpusher = Backpusher;
})((typeof exports !== 'undefined' ? exports : this));