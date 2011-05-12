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
    }
  });
  
  app.Todos = new app.TodoList;
  
  app.TodoView = Backbone.View.extend({
    tagName: 'li',
    
    template: _.template($('#item-template').html()),
    
    events: {
      'click .check':               'toggleDone',
      'dblclick div.todo-content':  'edit',
      'click span.todo-destroy':    'clear',
      'keypress .todo-input':       'updateOnEnter'
    },
    
    initialize: function() {
      _.bindAll(this, 'render', 'close');
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
      this.input = this.$('.todo.input');
      this.input.bind('blur', this.close);
      this.input.val(shortdesc);
    },
    
    toggleDone: function() {
      this.model.toggle();
    },
    
    edit: function() {
      $(this.el).addClass('editing');
      this.input.focus();
    },
    
    close: function() {
      this.model.save({
        shortdesc: this.input.val()
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
      'keyup #new-todo':    'showTooltip',
      'click .todo-clear a': 'clearCompleted',
      'click .title p input': 'selectShareUrl',
      'dblclick .title p input': 'selectShareUrl'
    },
    
    initialize: function() {
      _.bindAll(this, 'addOne', 'addAll', 'render');
      
      this.input = this.$('#new-todo');
      
      app.Todos.bind('add', this.addOne);
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
      this.input.val('');
    },
    
    clearCompleted: function() {
      _.each(app.Todos.done(), function(todo) {
        todo.clear();
      });
      
      return false;
    },
    
    showTooltip: function(e) {
      var tooltip = this.$('.ui-tooltip-top');
      var val = this.input.val();
      
      tooltip.fadeOut();
      
      if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
      if (val == '' || val == this.input.attr('placeholder')) return;
      
      var show = function() {
        tooltip.show().fadeIn();
      };
      
      this.tooltipTimeout = _.delay(show, 1000);
    },
    
    selectShareUrl: function(e) {
      $(e.currentTarget).select();
    }
  });
  
  window.AppInstance = new app.AppView;
});