;(function (factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else {
		window.TemplateView = factory();
	}
})(function () {

	/**
	 * _DEV_ will be false in min file and
	 * all if (_DEV_) ... will be removed
	 * @type {boolean}
	 */
	var _DEV_ = true;

	var doc = window.document;

	var $ = window.jQuery;

	function TemplateView(options) {
		options = options || {};

		this.id = TemplateView.nextId();
		this.events = {};
		this.listeners = [];
		this.data = extendPrototypeProp({object: this, prop: 'data', deep: false});
		this.node = $(options.node || '<div>');

		if (options.parent) {
			this.parent = options.parent;
		}

		this.ui = extend({root: this.node}, extendPrototypeProp({object: this, prop: 'ui', deep: false}));
		this.template = extendPrototypeProp({object: this, prop: 'template', deep: true});

		TemplateView.helpers.template(this, 'root', this.template);
	}

	extend(TemplateView, {
		$: $,

		currentId: 0,

		/**
		 * @returns {Number}
		 */
		nextId: function () {
			return ++TemplateView.currentId;
		}
	});

	extend(TemplateView.prototype, {
		/**
		 * @param {string} name
		 * @returns {*}
		 */
		get: function (name) {
			return this.data[name];
		},

		/**
		 * @param {string} name
		 * @param {*} value
		 * @returns {TemplateView}
		 */
		set: function (name, value) {
			if (this.get(name) === value) return this;

			var oldValue = this.data[name];

			this.data[name] = value;

			this.trigger('change:' + name, value, oldValue);
			this.trigger('change', name, value, oldValue);

			return this;
		},

		/**
		 * @param {string|Array} events
		 * @param {Function} callback
		 * @param {Object} [context]
		 * @param {boolean} [once]
		 * @returns {TemplateView}
		 */
		on: function (events, callback, context, once) {
			events = splitEvents(events);

			for (var i = 0, len = events.length; i < len; i++) {
				var event = events[i],
					callbacks = this.events[event];

				if (!event) continue;

				if (!callbacks) {
					callbacks = this.events[event] = [];
				}

				callbacks.push({
					once: once,
					context: context,
					callback: callback
				});
			}

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
					spliceBy(callbacks, findItem(callbacks, function (params) {
					    return params.callback === callback;
					}));
				}
				else {
					delete this.events[event];
				}
			}

			return this;
		},

		/**
		 * @param {string|Array} events
		 * @returns {TemplateView}
		 */
		trigger: function (events) {
			events = splitEvents(events);

			var args = slice(arguments, 1);

			for (var eI = 0, eLen = events.length; eI < eLen; eI++) {
				var event = events[eI],
					listeners = this.events[event];

				if (!listeners) continue;

				var hasEmpty = false;

				for (var i = 0, len = listeners.length; i < len; i++) {
					var listener = listeners[i];

					if (!listener) continue;

					if (listener.once) {
						hasEmpty = true;
						listeners[i] = null;
					}

					listener.callback.apply(listener.context || this, args);
				}

				if (hasEmpty) {
					listeners.forEach(function (listener, i) {
						if (!listener) {
							listeners.splice(i, 1);
						}
					});

					if (listeners.length === 0) {
						delete this.events[event];
					}
				}
			}

			return this;
		},

		/**
		 * @param {{
		 * 	target: Object,
		 * 	onMethod: string,
		 * 	offMethod: string,
		 * 	events: string,
		 * 	callback: Function,
		 * 	onExtraArgs?: Array,
		 * 	offExtraArgs?: Array,
		 * 	once?: boolean }} params
		 * @returns {TemplateView}
		 */
		listenTo: function (params) {
			var view = this,
				target = params.target,
				events = params.events,
				callback = params.callback,
				listenBy = '_listenBy' + this.id,
				cb = callback[listenBy];

			if (!cb) {
				cb = callback[listenBy] = function () {
					if (cb.once) {
						view.stopListening(target, cb.once, callback);
					}

					return callback.apply(view, arguments);
				};
			}

			if (params.once) {
				cb.once = (cb.once ? cb.once + ' ' : '') + params.events;
			}

			params.on(target, events, cb);

			var item = findItem(this.listeners, function (item) {
			    return item.target === target;
			});

			if (!item) {
				item = {
					target: target,
					off: params.off,
					events: {}
				};

				this.listeners.push(item);
			}

			events = splitEvents(events);

			for (var i = 0, len = events.length; i < len; i++) {
				var event = events[i],
					callbacks = item.events[event];

				if (!callbacks) {
					callbacks = item.events[event] = [];
				}

				callbacks.push(callback);
			}

			return this;
		},

		/**
		 * @param {Object} [target]
		 * @param {string|Array} [events]
		 * @param {Function} [callback]
		 * @returns {TemplateView}
		 */
		stopListening: function (target, events, callback) {
			var listener,
				listenBy = '_listenBy' + this.id;

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
						listener.off(target, event, callback[listenBy]);
					});
				}

				spliceBy(this.listeners, listener);
				break;

			case 2:
				events.forEach(function (event) {
					if (!listener.events.hasOwnProperty(event)) return;

					listener.events[event].forEach(function (callback) {
						listener.off(target, event, callback[listenBy]);
					});

					delete listener.events[events];
				});
				break;

			case 3:
				var cb = callback[listenBy];

				if (!cb) return this;

				events.forEach(function (event) {
					var callbacks = listener.events[event];

					if (!callbacks) return;

					listener.off(target, event, cb);

					spliceBy(callbacks, callback);
					
					if (callbacks.length === 0) {
						delete listener.events[event];
					}
				});
				break;
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

			callback = args[args.length - 1];

			if (typeof callback === 'boolean') {
				once = callback;
				args.pop();
				callback = args[args.length - 1];
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
					var args = [];

					if (callback) {
						args = [events, callback];
					}
					else if (events) {
						args = [events];
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
		},

		find: function (selector) {
			return this.node.querySelectorAll(selector);
		}
	});

	TemplateView.helpers = {
		template: templateHelper,
		'class': classHelper,
		toggleClass: classHelper,
		attr: attrHelper,
		prop: propHelper,
		style: styleHelper,
		html: htmlHelper,
		text: textHelper,
		on: onHelper,
		once: onceHelper
	};

	//region ====================== Helpers =======================================

	function templateHelper(view, root, template) {
		if (view.ui.hasOwnProperty(root)) {
			root = '{' + root + '}';
		}

		for (var selector in template) {
			if (!template.hasOwnProperty(selector)) return;

			var helpers = template[selector];

			if (selector.charAt(0) === '&') {
				selector = selector.slice(1);
			}
			else {
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

					view.listenOn(node, event, target, options[target], once);
				}
				break;

			case 'string':
				(function (method) {
					var prevent = method.charAt(0) === '!';

					if (prevent) {
						method = method.slice(1);
					}

					if (_DEV_) {
						if (method && typeof view[method] !== 'function') {
							console.warn('Undefined method "'+ method +'" in view ' + view.constructor.name);
						}
					}

					var cb = function (e) {
						if (prevent) {
							e.preventDefault();
						}

						if (!method) return;

						view[method].apply(view, arguments);
					};

					view.listenOn(node, event, cb, once);

				})(options);
				break;
			}
		}
	}

	function onceHelper(view, selector, events) {
		onHelper(view, selector, events, true);
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
					$(item)[method](firstArgument, valueCallback.call(view, item, i));
				};
			}
			else {
				eachCallback = function (item, i) {
					$(item)[method](valueCallback.call(view, item, i));
				};
			}

			node.forEach(eachCallback);
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

			var value = source[name];

			target[name] = typeof value === 'object' && value ? extendDeep(target[name], value) : value;
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

			func(target, typeof value === 'function' ? value.call(params.context, extendDeep) : value);
		}

		return target;
	}

	function toNode(source) {
		return typeof source === 'string' ? doc.querySelector(source) : source;
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

	/**
	 * @param {string|Array} events
	 * @returns {Array<string>}
	 */
	function splitEvents(events) {
	    return typeof events === 'object' ? events : events.indexOf(' ') > -1 ? events.split(/\s+/) : [events];
	}

	function slice(arr, start) {
	    return Array.prototype.slice.call(arr, start);
	}

	return TemplateView;
});