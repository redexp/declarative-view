;(function (factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	}
	else if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
		module.exports = factory(jQuery);
	}
	else {
		window.DeclarativeView = factory(jQuery);
	}
})(function ($) {

	/**
	 * _DEV_ will be false in min file and
	 * all if (_DEV_) ... will be removed
	 * @type {boolean}
	 */
	var _DEV_ = true;

	//region ====================== EventEmitter ==================================

	function EventEmitter() {
		this.events = {};
		this.listeners = [];
	}

	extend(EventEmitter, {
		extend: extendClass
	});

	extend(EventEmitter.prototype, {
		/**
		 * @param {string|Array} events
		 * @param {Function} callback
		 * @param {Object|boolean} [context]
		 * @param {boolean} [once]
		 * @returns {DeclarativeView}
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

				if (event === '>') {
					callback.call(context || view);
					return;
				}

				var wrapper = callback,
					not = false,
					prop,
					value;

				if (event.charAt(0) === '!') {
					not = true;
					event = event.slice(1);
				}

				var char = event.charAt(0),
					eq = char === '=',
					p = char === '/',
					a = char === '@'
				;

				if (eq || p || a) {
					prop = event.slice(1).split('.');
					value = view.get(prop);
				}

				if (not || prop) {
					wrapper = function (x) {
						var arg = prop ? view.get(prop) : x;

						if (not) {
							arg = !arg;
						}

						var args = [arg];

						if (arguments.length > 0) {
							args = args.concat(slice(arguments, not || (prop && arguments[0] !== arg) ? 0 : 1));
						}

						callback.apply(context || view, args);
					};
				}

				if (eq || a) {
					wrapper.call(context || view, value);
				}

				if (eq) return;

				if (p || a) {
					if (prop.length > 1 || value instanceof Array) {
						var model = modelByProp(view, prop);
						event = model instanceof ArrayWrapper ? 'change' : 'set/' + lastItem(prop);
						view.listenOn(model, event, wrapper);
						return;
					}
					else {
						event = 'set/' + prop.join('.');
					}
				}

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
			});

			return this;
		},

		/**
		 * @param {string|Array} events
		 * @param {Function} callback
		 * @param {Object} [context]
		 * @returns {DeclarativeView}
		 */
		once: function (events, callback, context) {
			return this.on(events, callback, context, true);
		},

		/**
		 * @param {string|Array} [events]
		 * @param {Function} [callback]
		 * @returns {DeclarativeView}
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
		 * @returns {DeclarativeView}
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
		 * @returns {DeclarativeView}
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
		 * @returns {DeclarativeView}
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
		 * @returns {DeclarativeView}
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
		 * @returns {DeclarativeView}
		 */
		listenOnce: function (target, events, callback) {
			var args = slice(arguments, 0);

			args.push(true);

			return this.listenOn.apply(this, args);
		}
	});

	//endregion

	function DeclarativeView(options) {
		DeclarativeView.parent.apply(this, arguments);

		options = options || {};

		this.id = DeclarativeView.nextId();
		this.wrappers = {sources: [], targets: []};
		this.node = $(options.node || this.node || '<div>');

		if (options.parent) {
			this.parent = options.parent;
		}

		if (options.wrappers) {
			var wrappers = options.wrappers;

			if (_DEV_) {
				if (wrappers.sources.length !== wrappers.targets.length) throw new Error('Number of sources and targets should be equal');
			}

			this.wrappers.sources = [].concat(wrappers.sources);
			this.wrappers.targets = [].concat(wrappers.targets);
		}

		if (!this.hasOwnProperty('data')) {
			this.data = {};
		}
		if (options.data) {
			extend(this.data, options.data);
		}
		extendPrototypeProp({object: this, target: this.data, prop: 'data', deep: false});

		this.ui = extendPrototypeProp({object: this, prop: 'ui', deep: false});
		if (options.ui) {
			extend(this.ui, options.ui);
		}

		this.template = extendPrototypeProp({object: this, prop: 'template', deep: true});
		if (options.template) {
			extendDeep(this.template, options.template);
		}

		for (var name in this.ui) {
			if (!this.ui.hasOwnProperty(name)) continue;

			ensureUI(this, name);
		}

		DeclarativeView.helpers.template(this, '', this.template);
	}

	extend(DeclarativeView, {
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

	extendClass(DeclarativeView, EventEmitter, {
		ui: {
			root: ''
		},

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

		set: function (prop, value) {
			if (prop instanceof Array) {
				var model = modelByProp(this, prop);
				model.set(lastItem(prop), value);
				return this;
			}

			if (typeof prop === 'object') {
				for (var name in prop) {
					if (!prop.hasOwnProperty(name)) continue;

					this.set(name, prop[name]);
				}

				return this;
			}

			var oldValue = this.get(prop);

			if (oldValue === value) return this;

			var sourceIndex = this.wrappers.sources.indexOf(oldValue);

			if (sourceIndex !== -1) {
				this.wrappers.targets[sourceIndex].clear();
			}

			this.data[prop] = value;

			this.trigger('set/' + prop, value, oldValue);
			this.trigger('set', prop, value, oldValue);

			return this;
		},

		has: function (prop) {
			return this.data.hasOwnProperty(prop);
		},

		model: function (prop) {
			if (prop instanceof Array) {
				var model = this;

				for (var i = 0, len = prop.length; i < len; i++) {
					if (_DEV_) {
						if (!model.has(prop[i])) {
							throw new Error('Undefined model ' + JSON.stringify(prop));
						}
					}

					model = model.model(prop[i]);
				}

				return model;
			}

			if (_DEV_) {
				if (!this.has(prop)) {
					throw new Error('Undefined model ' + JSON.stringify(prop));
				}
			}

			var source = this.get(prop),
				index = this.wrappers.sources.indexOf(source);

			if (index === -1) {
				var wrapper = this.wrapper(source, [prop]);
				if (!wrapper) return;
				this.wrappers.targets.push(wrapper);
				index = this.wrappers.sources.push(source) - 1;
			}

			return this.wrappers.targets[index];
		},

		modelOf: function (source) {
			var index = this.wrappers.sources.indexOf(source);
			return this.wrappers.targets[index];
		},

		assign: function (props, mode) {
			for (var prop in props) {
				if (!props.hasOwnProperty(prop)) continue;

				var value = props[prop];
				var hasProp = this.has(prop);

				if (!hasProp && mode === 'defaults') continue;

				if (hasProp && value && typeof value === 'object') {
					this.model(prop).assign(value, mode);
				}
				else {
					this.set(prop, value);
				}
			}
		},

		wrapper: function (item, path) {
			if (!item || typeof item !== 'object') return;

			var Wrapper = item instanceof Array ? ViewArrayWrapper : ViewObjectWrapper;

			return new Wrapper(this, path, item);
		},

		find: function (selector) {
			var aIndex = selector.indexOf('@');

			if (aIndex === 0) {
				var prop = selector.slice(1);

				if (this.ui.hasOwnProperty(prop)) return this.ui[prop];
			}

			if (aIndex > -1) {
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

	DeclarativeView.helpers = {
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
		click: clickHelper,
		value: valueHelper,
		checked: checkedHelper,
		connect: connectHelper,
		visible: visibleHelper,
		show: visibleHelper,
		hidden: hiddenHelper,
		hide: hiddenHelper,
		each: eachHelper
	};

	//region ====================== Helpers =======================================

	function templateHelper(view, root, template) {
		for (var selector in template) {
			if (!template.hasOwnProperty(selector)) return;

			var helpers = template[selector];

			if (typeof helpers === 'function') {
				helpers = helpers.call(view);
			}

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
					if (!DeclarativeView.helpers.hasOwnProperty(helper)) {
						throw new Error('Unknown helper "' + helper + '" in template of ' + view.constructor.name);
					}
				}

				DeclarativeView.helpers[helper](view, root + selector, helpers[helper]);
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

	function clickHelper(view, selector, options) {
		onHelper(view, selector, {click: options});
	}

	function valueHelper(view, selector, options) {
		propHelper(view, selector, {value: options});
	}

	function checkedHelper(view, selector, options) {
		convertHelperOptionsKeysToFirstArgument({
			view: view,
			node: view.find(selector),
			method: 'prop',
			options: {checked: options},
			wrapper: function (value) {
				return !!value;
			}
		});
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

			var wrapper;

			if (viewProp.indexOf('|') > -1) {
				viewProp = viewProp.split('|');
				if (viewProp[1] === 'number') {
					wrapper = Number;
				}
				viewProp = viewProp[0];
			}

			var path = viewProp;

			if (viewProp.indexOf('.') > -1) {
				path = viewProp.split('.');
			}

			view.listenOn(node, event, function () {
				var value = node.prop(nodeProp);
				view.set(path, wrapper ? wrapper(value) : value);
			});

			view.on('@' + viewProp, function (value) {
				if (value === node.prop(nodeProp)) return;

				node.prop(nodeProp, value);
			});
		}
	}

	function visibleHelper(view, selector, options) {
		convertHelperOptionsKeysToFirstArgument({
			view: view,
			node: view.find(selector),
			method: 'css',
			options: {'display': options},
			wrapper: function (v) {
				return v ? '' : 'none';
			}
		});
	}

	function hiddenHelper(view, selector, options) {
		convertHelperOptionsKeysToFirstArgument({
			view: view,
			node: view.find(selector),
			method: 'css',
			options: {'display': options},
			wrapper: function (v) {
				return v ? 'none': '';
			}
		});
	}

	//endregion

	//region ====================== Each Helper ===================================

	/**
	 * @param {DeclarativeView} view
	 * @param {string} selector
	 * @param {{
	 * 	 prop: string|Array,
	 * 	 view: DeclarativeView|function,
	 * 	 node: string|boolean,
	 * 	 dataProp?: string,
	 * 	 dataIndexProp?: string,
	 * 	 removeClass?: string,
	 * 	 template?: Object,
	 * 	 add?: function,
	 * 	 remove?: function,
	 * 	 move?: function,
	 * 	 sort?: function
	 * }} options
	 */
	function eachHelper(view, selector, options) {
		if (options === null) return;

		var root = view.find(selector),
			prop = options.prop,
			list = view.model(typeof prop === 'string' && prop.indexOf('.') > -1 ? prop.split('.') : prop),
			views = new ViewsList([]),
			tplSelector = options.node === false ? false : options.node || root.children();

		if (_DEV_) {
			if (!list) {
				throw new Error('Wrong each.prop path ' + JSON.stringify(prop) + ' in class ' + view.constructor.name);
			}
		}

		var tpl;

		if (tplSelector === false) {
			tpl = null;
		}
		else if (typeof tplSelector === 'string') {
			var char = tplSelector.charAt(0);
			if (char === '<') {
				tpl = $(tplSelector);
			}
			else if (char === '>' && tplSelector.indexOf(',') === -1) {
				tpl = root.children();
				tplSelector = tplSelector.slice(1).trim();
				if (tplSelector !== '*') {
					tpl = tpl.filter(tplSelector);
				}
			}
			else {
				tpl = root.find(tplSelector);
			}
		}
		else {
			tpl = $(tplSelector);
		}

		if (tpl) {
			tpl.detach();
			if (options.removeClass) {
				tpl.removeClass(options.removeClass);
			}
		}

		list.views = list.views || views;
		view.views = view.views || {};
		list.views[selector] = view.views[selector] = views;

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
				var res = options.view.call(view, item, tpl && tpl.clone());

				if (isClass(res)) {
					ViewClass = res;
				}
				else {
					itemView = res;
				}
			}
			else {
				ViewClass = DeclarativeView;
			}

			if (ViewClass) {
				var data = {},
					wrappers = null;

				if (options.dataProp) {
					data[options.dataProp] = item;

					if (typeof item === 'object' && item !== null) {
						wrappers = {
							sources: [item],
							targets: [list.modelOf(item)]
						};
					}
				}
				else if (typeof item === 'object' && item !== null) {
					extend(data, item);
				}
				else {
					data.value = item;
				}

				if (options.dataIndexProp) {
					data[options.dataIndexProp] = index;
				}

				itemView = new ViewClass({
					node: tpl && tpl.clone(),
					parent: view,
					data: data,
					wrappers: wrappers,
					template: options.template
				});
			}

			itemView.parent = itemView.parent || view;
			itemView.context = itemView.context || item;

			views.add(itemView, index);

			if (options.add) {
				options.add.call(view, root, itemView, index);
			}
			else {
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

			if (options.dataIndexProp) {
				updateDataIndexProp();
			}

			itemView.trigger('added');
		}

		function remove(item, index) {
			var itemView = views.get(index);

			itemView.trigger('removing');

			if (options.remove) {
				options.remove.call(view, root, itemView, index);
			}
			else {
				itemView.remove();
			}

			views.removeAt(index);

			if (options.dataIndexProp) {
				updateDataIndexProp();
			}
		}

		function move(item, index, oldIndex) {
			views.moveFrom(oldIndex, index);

			if (options.move) {
				options.move.call(view, root, views.get(index), index, oldIndex);
			}
			else {
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

			if (options.dataIndexProp) {
				updateDataIndexProp();
			}
		}

		function sort() {
			if (options.sort) {
				options.sort.call(view, root, views);
			}
			else {
				list.forEach(function (item, index) {
					var oldIndex = views.indexByContext(item);
					if (index === oldIndex) return;
					move(item, index, oldIndex);
				});
			}

			if (options.dataIndexProp) {
				updateDataIndexProp();
			}
		}

		function updateDataIndexProp() {
			views.forEach(function (view, index) {
				view.set(options.dataIndexProp, index);
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
			throw new Error('Unknown options type ' + (typeof options) + ' in view class ' + view.constructor.name);
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

		if (wrapper && typeof value !== 'function') {
			value = wrapper(value);
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

	//region ====================== Model =========================================

	var ModelMixin = {
		model: function (prop) {
			var source = this.get(prop),
				index = this.view.wrappers.sources.indexOf(source);

			if (index === -1) {
				var wrapper = this.view.wrapper(source, this.path.concat(prop));
				if (!wrapper) return;
				this.view.wrappers.targets.push(wrapper);
				index = this.view.wrappers.sources.push(source) - 1;
			}

			return this.view.wrappers.targets[index];
		},

		assign: DeclarativeView.prototype.assign,

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

	//endregion

	//region ====================== ObjectWrapper =================================

	function ObjectWrapper(context) {
		EventEmitter.call(this);

		this.context = context;
	}

	extendClass(ObjectWrapper, EventEmitter, {
		get: function (prop) {
			if (arguments.length === 0) {
				return this.context;
			}

			return this.context[prop];
		},

		set: function (prop, value) {
			if (typeof prop === 'object') {
				for (var name in prop) {
					if (!prop.hasOwnProperty(name)) continue;

					this.set(name, prop[name]);
				}

				return this;
			}

			var oldValue = this.get(prop);

			if (oldValue === value) return this;

			this.context[prop] = value;

			this.trigger('set/' + prop, value, oldValue);
			this.trigger('set', prop, value, oldValue);
			return this;
		},

		has: function (prop) {
			return this.context.hasOwnProperty(prop);
		}
	});

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

	Object.getOwnPropertyNames(Array.prototype).forEach(function (name) {
		if (ArrayWrapper.prototype[name] || typeof Array.prototype[name] !== 'function') return;

		ArrayWrapper.prototype[name] = function () {
			return Array.prototype[name].apply(this.context, arguments);
		};
	});

	if (!ArrayWrapper.prototype.find) {
		ArrayWrapper.prototype.find = function (cb) {
			return findItem(this.context, cb);
		};
	}

	extendClass(ArrayWrapper, ObjectWrapper, {
		length: function () {
			return this.context.length;
		},

		add: function (items, index) {
			if (items instanceof Array === false) {
				items = [items];
			}

			var arr = this.context,
				len = this.length();

			if (len === 0) {
				index = 0;
			}
			else if (index > len || typeof index === "undefined") {
				index = len;
			}
			else if (index < 0) {
				index = getRealIndex(index, len);
			}

			for (var i = 0, length = items.length; i < length; i++) {
				var item = items[i],
					itemIndex = index + i;

				if (itemIndex >= this.length()) {
					arr.push(item);
				}
				else {
					arr.splice(itemIndex, 0, item);
				}

				this.trigger('add', item, itemIndex);
				this.trigger('change', 'add', item, itemIndex);
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

			var index = this.indexOf(item);
			if (index > -1) {
				this.removeAt(index);
			}

			return this;
		},

		removeAt: function (index) {
			var len = this.length();

			if (len === 0) return this;

			if (index instanceof Array) {
				var indexes = sortIndexes(index, len);

				for (var i = 0, length = indexes.length; i < length; i++) {
					this.removeAt(indexes[i]);
				}

				return this;
			}
			else {
				index = getRealIndex(index, len);
			}

			if (index === -1) return this;

			var arr = this.context;

			var item = this.get(index);

			if (index + 1 === len) {
				arr.pop();
			}
			else if (index === 0) {
				arr.shift();
			}
			else {
				arr.splice(index, 1);
			}

			this.trigger('remove', item, index);
			this.trigger('change', 'remove', item, index);

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
			var len = this.length();

			if (len < 2 || oldIndex >= len) return this;

			oldIndex = getRealIndex(oldIndex, len);

			if (newIndex >= len) {
				newIndex = len - 1;
			}
			else {
				newIndex = getRealIndex(newIndex, len);
			}

			if (oldIndex === newIndex) return this;

			var item = this.get(oldIndex);
			this.context.splice(oldIndex, 1);
			this.context.splice(newIndex, 0, item);
			this.trigger('move', item, newIndex, oldIndex);
			this.trigger('change', 'move', item, newIndex, oldIndex);
			return this;
		},

		sort: function (callback) {
			this.context.sort(callback);
			this.trigger('sort');
			this.trigger('change', 'sort');
			return this;
		},

		reset: function (items) {
			this.removeAll();
			this.add(items);
			return this;
		},

		filterWhere: function (props) {
			return this.filter(function (item) {
				for (var prop in props) {
					if (!props.hasOwnProperty(prop)) continue;

					if (item[prop] !== props[prop]) return false;
				}

				return true;
			});
		},

		findWhere: function (props) {
			var arr = this.context;

			for (var i = 0, len = arr.length; i < len; i++) {
				var valid = false;

				for (var prop in props) {
					if (!props.hasOwnProperty(prop)) continue;

					valid = arr[i][prop] === props[prop];

					if (!valid) break;
				}

				if (valid) return arr[i];
			}
		},

		indexWhere: function (props) {
			var arr = this.context;

			for (var i = 0, len = arr.length; i < len; i++) {
				var valid = false;

				for (var prop in props) {
					if (!props.hasOwnProperty(prop)) continue;

					valid = arr[i][prop] === props[prop];

					if (!valid) break;
				}

				if (valid) return i;
			}

			return -1;
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

	extendClass(ViewArrayWrapper, ArrayWrapper, extend({}, ModelMixin, {
		modelOf: function (source) {
			var i = this.indexOf(source);
			if (i > -1) return this.model(i);
		},

		modelWhere: function (props) {
			var i = this.indexWhere(props);
			if (i > -1) return this.model(i);
		},

		assign: function (items) {
			return this.reset(items);
		}
	}));

	//endregion

	//region ====================== ViewsList =====================================

	function ViewsList() {
		ArrayWrapper.apply(this, arguments);
	}

	extendClass(ViewsList, ArrayWrapper, {
		indexByContext: function (context) {
			var arr = this.context;
			for (var i = 0, len = arr.length; i < len; i++) {
				if (arr[i].context === context) return i;
			}
		},

		viewOf: function (context) {
			var arr = this.context;
			for (var i = 0, len = arr.length; i < len; i++) {
				if (arr[i].context === context) return arr[i];
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

		var oldProto = Child.prototype;

		if (Object.create) {
			Child.prototype = Object.create(Parent.prototype);
		}
		else {
			var Extend = function () {};
			Extend.prototype = protoProps;
			Child.prototype = new Extend();
		}

		extend(Child.prototype, oldProto);

		Child.prototype.constructor = Child;

		extend(Child.prototype, protoProps);

		Child.extend = Parent.extend;
		Child.parent = Parent;
		Child.__super__ = Parent.prototype;

		return Child;
	}

	function extend(target) {
		for (var i = 1, len = arguments.length; i < len; i++) {
			var source = arguments[i];

			for (var name in source) {
				if (!source.hasOwnProperty(name)) continue;

				target[name] = source[name];
			}
		}

		return target;
	}

	function extendDeep(target) {
		for (var i = 1, len = arguments.length; i < len; i++) {
			var source = arguments[i];

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
		}

		return target;
	}

	/**
	 * @param {{
	 *   object: Object,
	 *   target?: Object,
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

		if (params.target) {
			for (var prop in target) {
				if (!target.hasOwnProperty(prop) || params.target.hasOwnProperty(prop)) continue;

				params.target[prop] = target[prop];
			}

			target = params.target;
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
			if (selector.charAt(0) === '<') {
				return view.ui[name] = $(selector);
			}

			var key = 'uiSelector' + view.id;

			selector = selector.replace(/@(\w+)/g, function (x, name) {
				return ensureUI(view, name)[key];
			});

			view.ui[name] = selector ? view.node.find(selector) : view.node;
			view.ui[name][key] = selector;
		}

		if (_DEV_) {
			if (typeof selector === 'undefined') {
				throw new Error('Undefined ui alias "' + name + '" in view ' + view.constructor.name);
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

		var last = lastItem(prop),
			value = model.get(last);

		if (value && typeof value === 'object') {
			model = model.model(last);
		}

		return model;
	}

	function getRealIndex(index, length) {
		if (length === 0 || index >= length) return -1;

		if (index < 0) {
			return getRealIndex(length + index, length);
		}

		return index;
	}

	function sortIndexes(indexes, length) {
		indexes = [].concat(indexes);

		for (var i = 0, len = indexes.length; i < len; i++) {
			indexes[i] = getRealIndex(indexes[i], length);
		}

		return indexes;
	}

	//endregion

	DeclarativeView.EventEmitter = EventEmitter;
	DeclarativeView.ObjectWrapper = ObjectWrapper;
	DeclarativeView.ArrayWrapper = ArrayWrapper;

	return DeclarativeView;
});