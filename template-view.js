;(function (factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	}
	else if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
		module.exports = factory(jQuery);
	}
	else {
		window.TemplateView = factory(jQuery);
	}
})(function ($) {

	/**
	 * _DEV_ will be false in min file and
	 * all if (_DEV_) ... will be removed
	 * @type {boolean}
	 */
	var _DEV_ = true;

	//region ====================== EventsHandler =================================

	function EventsHandler() {
		this.events = {};
		this.listeners = [];
	}

	extend(EventsHandler, {
		extend: extendClass
	});

	extend(EventsHandler.prototype, {
		/**
		 * @param {string|Array} events
		 * @param {Function} callback
		 * @param {Object|boolean} [context]
		 * @param {boolean} [once]
		 * @returns {TemplateView}
		 */
		on: function (events, callback, context, once) {
			events = splitEvents(events);

			if (typeof context === 'boolean') {
				once = context;
				context = null;
			}

			var view = this;

			events.forEach(function (event) {
				if (!event) return;

				var wrapper = callback,
					not = false,
					eq = false,
					a = false,
					prop;

				if (event.charAt(0) === '!') {
					not = true;
					event = event.slice(1);
				}

				if (event.charAt(0) === '=') {
					eq = true;
					prop = event.slice(1);
				}
				else if (event.charAt(0) === '@') {
					a = true;
					prop = event.slice(1);
					event = 'set/' + prop;
				}

				if ((eq || a) && prop.indexOf('.') > -1) {
					prop = prop.split('.');
				}

				if (not || prop) {
					wrapper = function (x) {
						var arg = prop ? view.get(prop) : x;

						if (not) {
							arg = !arg;
						}

						var args = [arg];

						if (arguments.length > 0) {
							args = args.concat(slice(arguments, prop && !not ? 1 : 0));
						}

						callback.apply(context || view, args);
					};
				}

				if (eq || a) {
					wrapper(view.get(prop));
				}

				if (eq) return;

				var callbacks = view.events[event];

				if (!callbacks) {
					callbacks = view.events[event] = [];
				}

				callbacks.push({
					once: once,
					context: context,
					callback: callback,
					wrapper: wrapper
				});

				if (prop instanceof Array) {
					view.listenOn(modelByProp(view, prop), 'set/' + lastItem(prop), wrapper);
				}
			});

			return this;
		},

		/**
		 * @param {string|Array} events
		 * @param {Function} callback
		 * @param {Object} [context]
		 * @returns {TemplateView}
		 */
		once: function (events, callback, context) {
			return this.on(events, callback, context, true);
		},

		/**
		 * @param {string|Array} [events]
		 * @param {Function} [callback]
		 * @returns {TemplateView}
		 */
		off: function (events, callback) {
			if (arguments.length === 0) {
				this.events = {};
				return this;
			}

			events = splitEvents(events);

			for (var i = 0, len = events.length; i < len; i++) {
				var event = events[i],
					callbacks = this.events[event];

				if (!callbacks) continue;

				if (callback) {
					for (var j = 0, cLen = callbacks.length; j < cLen; j++) {
						if (callbacks[j].callback === callback) {
							callbacks.splice(j, 1);
							break;
						}
					}

					if (callbacks.length === 0) {
						delete this.events[event];
					}
				}
				else {
					delete this.events[event];
				}
			}

			return this;
		},

		/**
		 * @param {string} event
		 * @returns {TemplateView}
		 */
		trigger: function (event) {
			var listeners = this.events[event];

			if (!listeners) return this;

			var args = slice(arguments, 1);

			for (var i = 0, len = listeners.length; i < len; i++) {
				var listener = listeners[i];

				if (listener.once) {
					listeners.splice(i, 1);
					i--;
					len--;
				}

				listener.wrapper.apply(listener.context || this, args);
			}

			if (listeners.length === 0) {
				delete this.events[event];
			}

			return this;
		},

		/**
		 * @param {{
		 * 	target: Object,
		 * 	events: string,
		 * 	callback: function,
		 * 	once: boolean,
		 * 	on: function,
		 * 	off: function }} params
		 * @returns {TemplateView}
		 */
		listenTo: function (params) {
			var view = this,
				target = params.target,
				events = params.events,
				callback = params.callback,
				once = params.once;

			var listener = findItem(this.listeners, function (listener) {
				return listener.target === target;
			});

			if (!listener) {
				listener = {
					target: target,
					off: params.off,
					events: {}
				};

				this.listeners.push(listener);
			}

			events = splitEvents(events);

			events.forEach(function (event) {
				var callbacks = listener.events[event];

				if (!callbacks) {
					callbacks = listener.events[event] = [];
				}

				var wrapper = function () {
					if (once) {
						view.stopListening(target, event, callback);
					}

					return callback.apply(view, arguments);
				};

				callbacks.push({
					origin: callback,
					wrapper: wrapper
				});

				params.on(target, event, wrapper);
			});

			return this;
		},

		/**
		 * @param {Object} [target]
		 * @param {string|Array} [events]
		 * @param {Function} [callback]
		 * @returns {TemplateView}
		 */
		stopListening: function (target, events, callback) {
			var listener;

			if (target) {
				listener = findItem(this.listeners, function (listener) {
					return listener.target === target;
				});

				if (!listener) return this;
			}

			if (events) {
				events = splitEvents(events);
			}

			switch (arguments.length) {
			case 0:
				for (var i = this.listeners.length - 1; i > -1; i--) {
					this.stopListening(this.listeners[i].target);
				}
				break;

			case 1:
				for (var event in listener.events) {
					if (!listener.events.hasOwnProperty(event)) continue;

					listener.events[event].forEach(function (callback) {
						listener.off(target, event, callback.wrapper);
					});
				}

				spliceBy(this.listeners, listener);
				break;

			case 2:
				events.forEach(function (event) {
					if (!listener.events.hasOwnProperty(event)) return;

					listener.events[event].forEach(function (callback) {
						listener.off(target, event, callback.wrapper);
					});

					delete listener.events[events];
				});
				break;

			case 3:
				events.forEach(function (event) {
					var callbacks = listener.events[event];

					if (!callbacks) return;

					callbacks.forEach(function (cb) {
						if (cb.origin !== callback) return;

						listener.off(target, event, cb.wrapper);

						spliceBy(callbacks, cb);
					});

					if (callbacks.length === 0) {
						delete listener.events[event];
					}
				});
				break;
			}

			if (listener && emptyObject(listener.events)) {
				spliceBy(this.listeners, listener);
			}

			return this;
		},

		/**
		 * @param {Object} target
		 * @param {string} events
		 * @param {...*} callback
		 * @returns {TemplateView}
		 */
		listenOn: function (target, events, callback) {
			var args = slice(arguments, 1),
				once = false;

			callback = lastItem(args);

			if (typeof callback === 'boolean') {
				once = callback;
				args.pop();
				callback = lastItem(args);
			}

			return this.listenTo({
				target: target,
				events: events,
				callback: callback,
				once: once,
				on: function (target, events, callback) {
					args[0] = events;
					args[args.length - 1] = callback;
					target.on.apply(target, args);
				},
				off: function (target, events, callback) {
					var args;

					if (callback) {
						args = [events, callback];
					}
					else if (events) {
						args = [events];
					}
					else {
						args = [];
					}

					target.off.apply(target, args);
				}
			});
		},

		/**
		 * @param {Object} target
		 * @param {string} events
		 * @param {...*} callback
		 * @returns {TemplateView}
		 */
		listenOnce: function (target, events, callback) {
			var args = slice(arguments, 0);

			args.push(true);

			return this.listenOn.apply(this, args);
		}
	});

	//endregion

	function TemplateView(options) {
		TemplateView.parent.apply(this, arguments);

		options = options || {};

		this.id = TemplateView.nextId();
		this.wrappers = {sources: [], targets: []};
		this.node = $(options.node || this.node || '<div>');

		if (options.parent) {
			this.parent = options.parent;
		}

		this.data = extendPrototypeProp({object: this, prop: 'data', deep: false});
		this.ui = extendPrototypeProp({object: this, prop: 'ui', deep: false});
		this.template = extendPrototypeProp({object: this, prop: 'template', deep: true});

		if (options.data) {
			extend(this.data, options.data);
		}

		if (options.ui) {
			extend(this.ui, options.ui);
		}

		if (options.template) {
			extendDeep(this.template, options.template);
		}

		for (var name in this.ui) {
			if (!this.ui.hasOwnProperty(name)) continue;

			ensureUI(this, name);
		}

		TemplateView.helpers.template(this, '', this.template);
	}

	extend(TemplateView, {
		$: $,

		ObjectWrapper: ObjectWrapper,

		ArrayWrapper: ArrayWrapper,

		currentId: 0,

		/**
		 * @returns {Number}
		 */
		nextId: function () {
			return ++this.currentId;
		}
	});

	extendClass(TemplateView, EventsHandler, {
		ui: {
			root: ''
		},

		/**
		 * @param {string} [prop]
		 * @returns {*}
		 */
		get: function (prop) {
			if (arguments.length === 0) {
				return this.data;
			}
			else if(prop instanceof Array) {
				var model = this;

				for (var i = 0, len = prop.length - 1; i < len; i++) {
					model = model.model(prop[i]);
				}

				return model.get(prop[len]);
			}

			return this.data[prop];
		},

		/**
		 * @param {string} prop
		 * @param {*} value
		 * @returns {TemplateView}
		 */
		set: function (prop, value) {
			var oldValue = this.get(prop);

			if (oldValue === value) return this;

			var sourceIndex = this.wrappers.sources.indexOf(oldValue);

			if (sourceIndex !== -1) {
				this.wrappers.targets[sourceIndex].clear();
			}

			if (prop instanceof Array) {
				var model = modelByProp(this, prop);
				model.set(lastItem(prop), value);
				return this;
			}

			this.data[prop] = value;

			this.trigger('set/' + prop, value, oldValue);
			this.trigger('set', prop, value, oldValue);

			return this;
		},

		model: function (prop) {
			if (prop instanceof Array) {
				var model = this;

				for (var i = 0, len = prop.length; i < len; i++) {
					model = model.model(prop[i]);
				}

				return model;
			}

			var source = this.get(prop),
				index = this.wrappers.sources.indexOf(source);

			if (index === -1) {
				index = this.wrappers.sources.push(source) - 1;
				this.wrappers.targets.push(this.wrapper(source, [prop]));
			}

			return this.wrappers.targets[index];
		},

		wrapper: function (item, path) {
			var Wrapper = item instanceof Array ? ViewArrayWrapper : ViewObjectWrapper;

			return new Wrapper(this, path, item);
		},

		/**
		 * @param {string} selector
		 * @returns {jQuery}
		 */
		find: function (selector) {
			if (selector.indexOf('@') > -1) {
				var view = this,
					key = 'uiSelector' + view.id;

				selector = selector.replace(/@(\w+)/, function (x, name) {
					return ensureUI(view, name)[key];
				});
			}

			return selector ? this.node.find(selector) : this.node;
		},

		remove: function () {
			this.stopListening();
			this.off();
			this.node.remove();
			return this;
		}
	});

	TemplateView.helpers = {
		template: templateHelper,
		'class': classHelper,
		toggleClass: classHelper,
		attr: attrHelper,
		prop: propHelper,
		style: styleHelper,
		css: styleHelper,
		html: htmlHelper,
		text: textHelper,
		on: onHelper,
		once: onceHelper,
		connect: connectHelper,
		each: eachHelper
	};

	//region ====================== Helpers =======================================

	function templateHelper(view, root, template) {
		for (var selector in template) {
			if (!template.hasOwnProperty(selector)) return;

			var helpers = template[selector];

			if (selector.charAt(0) === '&') {
				selector = selector.slice(1);
			}
			else if (root) {
				selector = ' ' + selector;
			}

			for (var helper in helpers) {
				if (!helpers.hasOwnProperty(helper)) continue;

				if (helper.charAt(0) === '&') {
					var ops = {};
					ops[helper] = helpers[helper];
					templateHelper(view, root + selector, ops);
					continue;
				}

				if (_DEV_) {
					if (!TemplateView.helpers.hasOwnProperty(helper)) {
						throw new Error('Unknown helper "' + helper + '" in template of ' + view.constructor.name);
					}
				}

				TemplateView.helpers[helper](view, root + selector, helpers[helper]);
			}
		}
	}

	function classHelper(view, selector, options) {
		convertHelperOptionsKeysToFirstArgument({
			view: view,
			node: view.find(selector),
			method: 'toggleClass',
			options: options,
			wrapper: function (value) {
				return !!value;
			}
		});
	}

	function attrHelper(view, selector, options) {
		convertHelperOptionsKeysToFirstArgument({
			view: view,
			node: view.find(selector),
			method: 'attr',
			options: options
		});
	}

	function propHelper(view, selector, options) {
		convertHelperOptionsKeysToFirstArgument({
			view: view,
			node: view.find(selector),
			method: 'prop',
			options: options
		});
	}

	function styleHelper(view, selector, options) {
		convertHelperOptionsKeysToFirstArgument({
			view: view,
			node: view.find(selector),
			method: 'css',
			options: options
		});
	}

	function htmlHelper(view, selector, options) {
		convertHelperOptionsToViewEvents({
			view: view,
			node: view.find(selector),
			method: 'html',
			options: options
		});
	}

	function textHelper(view, selector, options) {
		convertHelperOptionsToViewEvents({
			view: view,
			node: view.find(selector),
			method: 'text',
			options: options,
			wrapper: function (value) {
				return value === null || typeof value === 'undefined' ? '' : value;
			}
		});
	}

	function onHelper(view, selector, events, once) {
		var node = view.find(selector);
		once = !!once;

		for (var event in events) {
			if (!events.hasOwnProperty(event)) continue;

			var options = events[event];

			switch (typeof options) {
			case 'function':
				view.listenOn(node, event, options, once);
				break;

			case 'object':
				for (var target in options) {
					if (!options.hasOwnProperty(target)) continue;

					var cb = options[target];

					if (typeof cb === 'string') {
						cb = stringToCallback(cb);
					}

					view.listenOn(node, event, target, cb, once);
				}
				break;

			case 'string':
				view.listenOn(node, event, stringToCallback(options), once);
				break;
			}
		}

		function stringToCallback(method) {
			var prevent = method.charAt(0) === '!';

			if (prevent) {
				method = method.slice(1);
			}

			if (_DEV_) {
				if (method && typeof view[method] !== 'function') {
					console.warn('Undefined method "'+ method +'" in view ' + view.constructor.name);
				}
			}

			return function (e) {
				if (prevent) {
					e.preventDefault();
				}

				if (!method) return;

				view[method].apply(view, arguments);
			};
		}
	}

	function onceHelper(view, selector, events) {
		onHelper(view, selector, events, true);
	}

	function connectHelper(view, selector, options) {
		var node = view.find(selector);

		for (var nodeProp in options) {
			if (!options.hasOwnProperty(nodeProp)) continue;

			connectHelperBind(nodeProp, options[nodeProp]);
		}

		function connectHelperBind(nodeProp, viewProp) {
			var event = 'change';

			if (nodeProp.indexOf('|') > -1) {
				nodeProp = nodeProp.split('|');
				event = nodeProp[1];
				nodeProp = nodeProp[0];
			}

			view.listenOn(node, event, function () {
				view.set(viewProp, node.prop(nodeProp));
			});

			view.on('@' + viewProp, function (value) {
				if (value === node.prop(nodeProp)) return;

				node.prop(nodeProp, value);
			});
		}
	}

	//endregion

	//region ====================== Each Helper ===================================

	function eachHelper(view, selector, options) {
		var root = view.find(selector),
			list = view.model(options.prop),
			views = new ViewsList([]),
			tplSelector = options.node || '> *';

		var tpl = typeof tplSelector === 'string' && tplSelector.charAt(0) !== '<' ? root.find(tplSelector) : $(tplSelector);
		tpl.detach();

		list.views = list.views || {};
		list.views[selector] = views;

		view.listenOn(list, 'add', add);
		view.listenOn(list, 'remove', remove);
		view.listenOn(list, 'move', move);
		view.listenOn(list, 'sort', sort);

		list.forEach(add);

		function add(item, index) {
			var ViewClass, itemView;

			if (isClass(options.view)) {
				ViewClass = options.view;
			}
			else if (options.view) {
				var res = options.view.call(view, item, tpl.clone());

				if (isClass(res)) {
					ViewClass = res;
				}
				else {
					itemView = res;
					itemView.parent = itemView.parent || view;
				}
			}
			else {
				ViewClass = TemplateView;
			}

			if (ViewClass && options.template) {
				ViewClass = ViewClass.extend({
					template: options.template
				});
			}

			if (ViewClass) {
				itemView = new ViewClass({
					node: tpl.clone(),
					parent: view,
					data: typeof item !== 'object' ? {value: item} : extend({}, item)
				});
			}

			itemView.context = item;

			views.add(itemView, index);

			if (options.add) {
				options.add.call(view, root, itemView, index);
				return;
			}

			if (index === 0) {
				if (views.length() === 1) {
					root.append(itemView.node);
				}
				else {
					itemView.node.insertBefore(views.get(1).node);
				}
			}
			else {
				itemView.node.insertAfter(views.get(index - 1).node);
			}
		}

		function remove(item, index) {
			if (options.remove) {
				options.remove.call(view, root, views.get(index), index);
			}
			else {
				views.get(index).remove();
			}

			views.removeAt(index);
		}

		function move(item, index, oldIndex) {
			views.moveFrom(oldIndex, index);

			if (options.move) {
				options.move.call(view, root, views.get(index), index, oldIndex);
				return;
			}

			var node = views.get(index).node;

			if (index === 0) {
				if (views.length() === 1) {
					node.appendTo(root);
				}
				else {
					node.insertBefore(views.get(1).node);
				}
			}
			else {
				node.insertAfter(views.get(index - 1).node);
			}
		}

		function sort() {
			if (options.sort) {
				options.sort.call(view, root, views);
				return;
			}

			list.forEach(function (item, index) {
				var oldIndex = views.indexByContext(item);
				if (index === oldIndex) return;
				move(item, index, oldIndex);
			});
		}
	}

	//endregion

	//region ====================== jQuery Helpers ================================

	function convertHelperOptionsToViewEvents(params) {
		var view = params.view,
			options = params.options;

		params = extend({}, params);

		switch (typeof options) {
		case 'string':
			addListener(options);
			break;

		case 'object':
			if (options === null) break;

			for (var events in options) {
				if (!options.hasOwnProperty(events) || options[events] === null) continue;

				addListener(events, options[events]);
			}
			break;

		case 'function':
			params.value = options.call(view);
			callJqueryMethod(params);
			break;

		default:
			throw new Error('Unknown options type');
		}

		function addListener(events, func) {
			view.on(events, function () {
				params.value = func ? func.apply(view, arguments) : arguments[0];
				callJqueryMethod(params);
			});
		}
	}

	function callJqueryMethod(params) {
		var view = params.view,
			node = params.node,
			method = params.method,
			firstArgument = params.firstArgument,
			value = params.value,
			wrapper = params.wrapper;

		if (_DEV_) {
			if (node.length === 0) {
				console.warn('Empty result by selector "' + node.selector + '" in ' + params.view.constructor.name);
			}
		}

		if (typeof value === 'function') {
			var eachCallback, valueCallback = value;

			if (wrapper) {
				valueCallback = function (item, i) {
					return wrapper(value.call(view, item, i));
				};
			}

			if (firstArgument) {
				eachCallback = function (item, i) {
					item[method](firstArgument, valueCallback.call(view, item, i));
				};
			}
			else {
				eachCallback = function (item, i) {
					item[method](valueCallback.call(view, item, i));
				};
			}

			for (var i = 0, len = node.length; i < len; i++) {
				eachCallback($(node[i]), i);
			}
		}
		else if (firstArgument) {
			node[method](firstArgument, value);
		}
		else {
			node[method](value);
		}
	}

	function convertHelperOptionsKeysToFirstArgument(ops) {
		var options = ops.options;

		for (var name in options) {
			if (!options.hasOwnProperty(name)) continue;

			ops.firstArgument = name;
			ops.options = options[name];
			convertHelperOptionsToViewEvents(ops);
		}
	}

	//endregion

	//region ====================== ObjectWrapper =================================

	function ObjectWrapper(context) {
		EventsHandler.call(this);

		this.context = context;
	}

	extendClass(ObjectWrapper, EventsHandler, {
		get: function (prop) {
			if (arguments.length === 0) {
				return this.context;
			}

			return this.context[prop];
		},

		set: function (prop, value) {
			var oldValue = this.get(prop);

			if (oldValue === value) return this;

			this.context[prop] = value;

			this.trigger('set/' + prop, value, oldValue);
			this.trigger('set', prop, value, oldValue);
			return this;
		}
	});

	var ModelMixin = {
		model: function (prop) {
			var source = this.get(prop),
				index = this.view.wrappers.sources.indexOf(source);

			if (index === -1) {
				index = this.view.wrappers.sources.push(source) - 1;
				this.view.wrappers.targets.push(this.view.wrapper(source, this.path.concat(prop)));
			}

			return this.view.wrappers.targets[index];
		},

		clear: function () {
			var index = this.view.wrappers.sources.indexOf(this.context);

			if (index !== -1) {
				var target = this.view.wrappers.targets[index];

				this.view.stopListening(target);

				this.view.wrappers.sources.splice(index, 1);
				this.view.wrappers.targets.splice(index, 1);
			}

			var props = this.get();

			for (var prop in props) {
				if (!props.hasOwnProperty(prop)) continue;

				index = this.view.wrappers.sources.indexOf(props[prop]);

				if (index !== -1) {
					this.view.wrappers.targets[index].clear();
				}
			}

			this.view = this.path = this.context = null;
		}
	};

	function ViewObjectWrapper(view, path, context) {
		ObjectWrapper.call(this, context);

		this.view = view;
		this.path = path;

		this.on('set', function (prop, value, oldValue) {
			var sourceIndex = this.view.wrappers.sources.indexOf(oldValue);

			if (sourceIndex !== -1) {
				this.view.wrappers.targets[sourceIndex].clear();
			}
		});
	}

	extendClass(ViewObjectWrapper, ObjectWrapper, ModelMixin);

	//endregion

	//region ====================== ArrayWrapper ==================================

	function ArrayWrapper() {
		ObjectWrapper.apply(this, arguments);
	}

	extendClass(ArrayWrapper, ObjectWrapper, {
		indexOf: function (item) {
			return this.context.indexOf(item);
		},

		forEach: function (cb) {
			this.context.forEach(cb);
			return this;
		},

		length: function () {
			return this.context.length;
		},

		add: function (items, index) {
			if (items instanceof Array === false) {
				items = [items];
			}

			var arr = this.context;

			if (typeof index === "undefined") {
				index = arr.length;
			}

			for (var i = 0, len = items.length; i < len; i++) {
				var item = items[i],
					itemIndex = index + i;

				if (arr.length <= itemIndex) {
					arr.push(item);
				}
				else {
					arr.splice(itemIndex, 0, item);
				}
				this.trigger('add', item, itemIndex);
			}

			return this;
		},

		remove: function (item) {
			if (item instanceof Array) {
				for (var i = 0, len = item.length; i < len; i++) {
					this.remove(item[i]);
				}

				return this;
			}

			this.removeAt(this.indexOf(item));

			return this;
		},

		removeAt: function (index) {
			if (index instanceof Array) {
				index = index.length === 1 ? index : [].concat(index).sort(function (a, b) {
					return b - a;
				});

				for (var i = 0, len = index.length; i < len; i++) {
					this.removeAt(index[i]);
				}

				return this;
			}

			var arr = this.context;

			if (!arr.hasOwnProperty(index)) return this;

			var item = arr[index];

			if (index + 1 === arr.length) {
				arr.pop();
			}
			else if (index === 0) {
				arr.shift();
			}
			else {
				arr.splice(index, 1);
			}

			this.trigger('remove', item, index);

			return this;
		},

		removeAll: function () {
			for (var i = this.length() - 1; i > -1; i--) {
				this.removeAt(i);
			}

			return this;
		},

		replace: function (oldItem, newItem) {
			return this.replaceAt(this.indexOf(oldItem), newItem);
		},

		replaceAt: function (index, newItem) {
			this.removeAt(index);
			this.add(newItem, index);
			return this;
		},

		move: function (item, index) {
			return this.moveFrom(this.indexOf(item), index);
		},

		moveFrom: function (oldIndex, newIndex) {
			if (oldIndex === newIndex) return this;

			var item = this.get(oldIndex);
			this.context.splice(oldIndex, 1);
			this.context.splice(newIndex, 0, item);
			this.trigger('move', item, newIndex, oldIndex);
			return this;
		},

		sort: function (callback) {
			this.context.sort(callback);
			this.trigger('sort');
			return this;
		}
	});

	function ViewArrayWrapper(view, path, context) {
		ViewObjectWrapper.apply(this, arguments);

		this.on('remove', function (item) {
			var sourceIndex = this.view.wrappers.sources.indexOf(item);

			if (sourceIndex !== -1) {
				this.view.wrappers.targets[sourceIndex].clear();
			}
		});
	}

	extendClass(ViewArrayWrapper, ArrayWrapper, ModelMixin);

	function ViewsList() {
		ArrayWrapper.apply(this, arguments);
	}

	extendClass(ViewsList, ArrayWrapper, {
		indexByContext: function (context) {
			var arr = this.context;
			for (var i = 0, len = arr.length; i < len; i++) {
				if (arr[i].context === context) return i;
			}
		}
	});

	//endregion

	//region ====================== Utils =========================================

	function extendClass(Child, Parent, protoProps) {
		if (typeof this === 'function') {
			protoProps = arguments[0] || {};

			Parent = this;
			Child = protoProps.hasOwnProperty('constructor') ? protoProps.constructor : function () { Parent.apply(this, arguments); };
		}

		if (Object.create) {
			Child.prototype = Object.create(Parent.prototype);
		}
		else {
			var Extend = function () {};
			Extend.prototype = protoProps;
			Child.prototype = new Extend();
		}

		Child.prototype.constructor = Child;

		extend(Child.prototype, protoProps);

		Child.extend = Parent.extend;
		Child.parent = Parent;
		Child.__super__ = Parent.prototype;

		return Child;
	}

	function extend(target, source) {
	    for (var name in source) {
	    	if (!source.hasOwnProperty(name)) continue;

	    	target[name] = source[name];
		}

		return target;
	}

	function extendDeep(target, source) {
		for (var name in source) {
			if (!source.hasOwnProperty(name)) continue;

			target[name] = (
				target[name] &&
				source[name] &&
				typeof target[name] === 'object' &&
				typeof source[name] === 'object'
			) ?
				extendDeep(target[name], source[name]) :
				source[name]
			;
		}

		return target;
	}

	/**
	 * @param {{
	 *   object: Object,
	 *   prop: string,
	 *   deep: boolean,
	 *   list?: Array,
	 *   context?: Object }} params
	 * @returns {Object|undefined}
	 */
	function extendPrototypeProp(params) {
		var proto = Object.getPrototypeOf(params.object);

		if (!proto) return;

		var first = !params.list;

		if (first) {
			params.context = params.object;
			params.list = [];
		}

		params.list.push(proto[params.prop]);

		params.object = proto;

		extendPrototypeProp(params);

		if (!first) return;

		var list = params.list,
			func = params.deep ? extendDeep : extend,
			target = {};

		for (var i = list.length - 1; i >= 0; i--) {
			var value = list[i];

			func(target, typeof value === 'function' ? value.call(params.context, func) : params.deep ? cloneDeep(value) : value);
		}

		return target;
	}

	function cloneDeep(source) {
		var target = {};

		for (var prop in source) {
			if (!source.hasOwnProperty(prop)) continue;

			var value = source[prop];

			target[prop] = value && typeof value === 'object' ? cloneDeep(value) : value;
		}

		return target;
	}

	function spliceBy(arr, item) {
	    var index = arr.indexOf(item);
	    if (index === -1) return;
	    arr.splice(index, 1);
	}

	function findItem(arr, callback) {
	    for (var i = 0, len = arr.length; i < len; i++) {
			if (callback(arr[i], i)) return arr[i];
		}
	}

	function lastItem(arr) {
		return arr[arr.length - 1];
	}

	/**
	 * @param {string|Array} events
	 * @returns {Array<string>}
	 */
	function splitEvents(events) {
	    return typeof events === 'object' ? events : events.indexOf(' ') > -1 ? events.split(/\s+/) : [events];
	}

	function slice(arr, start) {
	    return arr.length > start ? Array.prototype.slice.call(arr, start) : [];
	}

	function emptyObject(obj) {
	    for (var name in obj) {
	    	if (obj.hasOwnProperty(name)) return false;
		}

		return true;
	}

	function ensureUI(view, name) {
		var selector = view.ui[name];

		if (typeof selector === 'string') {
			var key = 'uiSelector' + view.id;

			selector = selector.replace(/@(\w+)/g, function (x, name) {
				return ensureUI(view, name)[key];
			});

			view.ui[name] = selector ? view.node.find(selector) : view.node;
			view.ui[name][key] = selector;
		}

		if (_DEV_) {
			if (typeof selector === 'undefined') {
				throw new Error('Undefined ui alias "' + name + '" in view ' + this.constructor.name);
			}
		}

		return view.ui[name];
	}

	function isClass(func) {
		return typeof func === 'function' && typeof func.extend === 'function';
	}

	function modelByProp(view, prop) {
		var model = view;
		for (var i = 0, len = prop.length - 1; i < len; i++) {
			model = model.model(prop[i]);
		}
		return model;
	}

	//endregion

	return TemplateView;
});