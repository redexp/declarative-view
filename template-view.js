;(function (factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else {
		window.TemplateView = factory();
	}
})(function () {

	/**
	 * __DEV__ will be false in min file and
	 * all if (__DEV__) ... will be removed
	 * @type {boolean}
	 */
	var __DEV__ = true;

	var doc = window.document;

	function TemplateView(options) {
		this.id = TemplateView.nextId();
		this.data = {};
		this.events = {};
		this.observers = [];
		this.node = toNode(options.node);
		this.ui = {root: this.node};
	}

	extend(TemplateView, {
		currentId: 0,

		nextId: function () {
			return ++TemplateView.currentId;
		}
	});

	extend(TemplateView.prototype, {
		get: function (name) {
			return this.data[name];
		},

		set: function (name, value) {
			if (this.get(name) === value) return this;

			var oldValue = this.data[name];

			this.data[name] = value;

			this.trigger('change:' + name, value, oldValue);
			this.trigger('change', name, value, oldValue);

			return this;
		},

		on: function (events, callback) {
			events = events.split(/\s+/);

			for (var i = 0, len = events.length; i < len; i++) {
				var event = events[i],
					callbacks = this.events[event];

				if (!callbacks) {
					callbacks = this.events[event] = [];
				}

				callbacks.push(callback);
			}

			return this;
		},

		off: function (events, callback) {
			if (arguments.length === 0) {
				this.events = {};
				return this;
			}

			events = events.split(/\s+/);

			for (var i = 0, len = events.length; i < len; i++) {
				var event = events[i],
					callbacks = this.events[event];

				if (!callbacks) continue;

				if (callback) {
					spliceBy(callbacks, callback);
				}
				else {
					delete this.events[event];
				}
			}

			return this;
		},

		trigger: function (event) {
			if (!this.events[event]) return this;

			var args = Array.prototype.slice.call(arguments, 1),
				callbacks = this.events[event];

			for (var i = 0, len = callbacks.length; i < len; i++) {
				callbacks[i].apply(this, args);
			}

			return this;
		},

		listenTo: function (target, methods, events, callback, optional) {
			var view = this,
				onMethod = methods[0],
				offMethod = methods[1];

			var cb = callback['_listenBy' + this.id] = function () {
				return callback.apply(view, arguments);
			};

			if (arguments.length === 5) {
				target[onMethod](events, cb, optional);
			}
			else {
				target[onMethod](events, cb);
			}

			var item = findItem(this.observers, function (item) {
			    return item.target === target;
			});

			if (!item) {
				item = {
					target: target,
					offMethod: offMethod,
					events: {}
				};

				this.observers.push(item);
			}

			TemplateView.prototype.on.call(item, events, callback);

			return this;
		},

		stopListening: function (target, events, callback) {
			var observer, offMethod, listenBy = '_listenBy' + this.id;

			if (target) {
				observer = findItem(this.observers, function (observer) {
					return observer.target === target;
				});

				if (!observer) return this;

				offMethod = observer.offMethod;
			}

			switch (arguments.length) {
			case 0:
				for (var i = this.observers.length - 1; i > -1; i--) {
					this.stopListening(this.observers[i].target);
				}
				break;

			case 1:
				for (var event in observer.events) {
					if (!observer.events.hasOwnProperty(event)) continue;

					observer.events[event].forEach(function (cb) {
						target[offMethod](event, cb[listenBy]);
					});
				}

				spliceBy(this.observers, observer);
				break;

			case 2:
				if (!observer.events[events]) return this;

				observer.events[events].forEach(function (cb) {
				    target[offMethod](events, cb[listenBy]);
				});

				delete observer.events[events];
				break;

			case 3:
				if (!observer.events[events] || observer.events[events].indexOf(callback) === -1) return this;
				target[offMethod](events, callback[listenBy]);
				spliceBy(observer.events[events], callback);
				break;
			}

			return this;
		},

		listenOn: function (target, event, callback) {
			return this.listenTo(target, ['on', 'off'], event, callback);
		},

		listenNode: function (node, event, callback) {
			return this.listenTo(node, ['addEventListener', 'removeEventListener'], event, callback, false);
		},

		find: function (selector) {
			return this.node.querySelectorAll(selector);
		}
	});

	function extend(target, source) {
	    for (var name in source) {
	    	if (!source.hasOwnProperty(name)) continue;

	    	target[name] = source[name];
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
});