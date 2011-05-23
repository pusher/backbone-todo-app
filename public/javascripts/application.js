// Place your application-specific JavaScript functions and classes here
// This file is automatically included by javascript_include_tag :defaults
;$(function(){
  //Backbone.emulateJSON = true;

  window.app = window.app || {};

  app.Todo = Backbone.Model.extend({
    EMPTY: 'Empty todo...',

    url: function() {
      var id = this.get('id');
      return app.list_path + (id ? '/items/' + id : '/items') + '.json'
    },

    initialize: function() {
      if (!this.get('shortdesc')) {
        this.set({'shortdesc': this.EMPTY});
      }
    },

    toggle: function() {
      this.save({
        isdone: !this.get('isdone')
      });
    },

    clear: function() {
      this.destroy();
      this.view.remove();
    }
  });

  app.TodoList = Backbone.Collection.extend({
    model: app.Todo,
    url: function() {
      return app.list_path + '/items.json';
    },

    done: function() {
      return this.filter(function(todo) {
        return todo.get('isdone');
      });
    },

    remaining: function() {
      return this.filter(function(todo) {
        return !todo.get('isdone');
      });
    },

    comparator: function(todo) {
      return todo.get('id');
    },

    // This method is overridden to save us messing around
    // with socket_id filtering.
    add: function(models, options) {
      if (_.isArray(models)) {
        for (var i = 0, l = models.length; i < l; i++) {
          if (models[i].id && !app.Todos.get(models[i].id)) {
            this._add(models[i], options);
          }
        }
      } else {
        if (models.id && !app.Todos.get(models.id)) {
          this._add(models, options);
        }
      }
      return this;
    }
  });

  app.Todos = new app.TodoList;

  app.TodoView = Backbone.View.extend({
    tagName: 'li',

    template: _.template($('#item-template').html()),

    events: {
      'click .check':               'toggleDone',
      'click span.todo-edit':       'edit',
      'click span.todo-destroy':    'clear',
      'keypress .todo-input':       'updateOnEnter'
    },

    initialize: function() {
      _.bindAll(this, 'render', 'close');
      this.model.bind('remove', this.remove);
      this.model.bind('change', this.render);
      this.model.view = this;
    },

    render: function() {
      var model = this.model.toJSON();
      $(this.el).html(this.template(model));
      this.setContent();
      return this;
    },

    setContent: function() {
      var shortdesc = this.model.get('shortdesc');
      this.$('.todo-content').text(shortdesc);
      this.edit_input = this.$('.todo-input');
      this.edit_input.bind('blur', this.close);
      this.edit_input.val(shortdesc);
    },

    toggleDone: function() {
      this.model.toggle();
    },

    edit: function() {
      $(this.el).addClass('editing');
      this.edit_input.focus();
    },

    close: function() {
      this.model.save({
        shortdesc: this.edit_input.val(),
      });
      $(this.el).removeClass('editing');
    },

    updateOnEnter: function(e) {
      if(e.keyCode == 13) this.close();
    },

    remove: function() {
      $(this.el).remove();
    },

    clear: function() {
      this.model.clear();
    }
  });

  app.AppView = Backbone.View.extend({
    el: $('#todoapp'),

    statsTemplate: _.template($('#stats-template').html()),

    events: {
      'keypress #new-todo': 'createOnEnter',
      'focus #new-todo':    'showTooltip',
      'blur #new-todo':    'hideTooltip',
      'click .todo-clear a': 'clearCompleted',
      'click .title p input': 'selectShareUrl',
      'dblclick .title p input': 'selectShareUrl'
    },

    initialize: function() {
      _.bindAll(this, 'addOne', 'removeOne', 'addAll', 'render', 'showTooltip', 'hideTooltip');

      this.input = this.$('#new-todo');

      this.$('.ui-tooltip-top').hide();

      app.Todos.bind('add', this.addOne);
      app.Todos.bind('remove', this.removeOne);
      app.Todos.bind('refresh', this.addAll);
      app.Todos.bind('all', this.render);

      app.Todos.fetch();
    },

    render: function() {
      this.$('#todo-stats').html(this.statsTemplate({
        total: app.Todos.length,
        done: app.Todos.done().length,
        remaining: app.Todos.remaining().length
      }));
    },

    addOne: function(todo) {
      var view = new app.TodoView({model: todo});
      this.$('#todo-list').append(view.render().el);
    },

    removeOne: function(todo) {
      this.$("#todo-item-" + todo.id).parent('li').remove();
    },

    addAll: function() {
      app.Todos.each(function(todo) {
        var view = new app.TodoView({model: todo});
        this.$('#todo-list').prepend(view.render().el);
      });
    },

    newAttributes: function() {
      return {
        shortdesc: this.input.val(),
        isdone: false
      };
    },

    createOnEnter: function(e) {
      if (e.keyCode != 13) return;

      app.Todos.create(this.newAttributes());
      this.input.val('Adding...').addClass('working');
      _.delay(function(el) {
        if (el.val() == 'Adding...') el.val('').blur().removeClass('working');
      }, 1000, this.input);
    },

    clearCompleted: function() {
      _.each(app.Todos.done(), function(todo) {
        todo.clear();
      });

      return false;
    },

    showTooltip: function(e) {
      document.title = "Todos";

      var tooltip = this.$('.ui-tooltip-top');
      var self = this;

      if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);

      this.tooltipTimeout = _.delay(function() {
        tooltip.fadeIn(300);
        self.tooltipTimeout = _.delay(self.hideTooltip, 2400);
      }, 400);
    },

    hideTooltip: function() {
      var tooltip = this.$('.ui-tooltip-top');
      if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);

      tooltip.fadeOut(300);
    },

    selectShareUrl: function(e) {
      $(e.currentTarget).select();
    }
  });

  window.AppInstance = new app.AppView;

  var pusher = new Pusher('511a5abb7486107ce643');
  var channel = pusher.subscribe(window.app.list_channel);

  app.TodosBackpusher = new Backpusher(channel, app.Todos);


  app.TodosBackpusher.bind('remote_create', function(model) {
    var title = document.title;
    var matches = title.match(/\[(\d+) (\w+)\]/);

    console.log(matches);

    if (matches && matches[2] == 'new') {
      var count = parseInt(matches[1], 10);
      document.title = 'Todos [' + (++count) + ' new]';
    } else {
      document.title = 'Todos [1 new]';
    }
  });

  app.TodosBackpusher.bind('remote_update', function(model) {
    var title = document.title;
    var matches = title.match(/\[(\d+) (\w+)\]/);

    if (matches && matches[2] == 'updated') {
      var count = parseInt(matches[1], 10);
      document.title = 'Todos [' + (++count) + ' updated]';
    } else {
      document.title = 'Todos [1 updated]';
    }
  });

  app.TodosBackpusher.bind('remote_destroy', function(model) {
    var title = document.title;
    var matches = title.match(/\[(\d+) (\w+)\]/);

    if (matches && matches[2] == 'removed') {
      var count = parseInt(matches[1], 10);
      document.title = 'Todos [' + (++count) + ' removed]';
    } else {
      document.title = 'Todos [1 removed]';
    }
  });

  window.onfocus = function() {
    setTimeout(function(){
      document.title = 'Todos';
    }, 500);
  };

  document.onfocusin = function() {
    setTimeout(function(){
      document.title = 'Todos';
    }, 500);
  }
});