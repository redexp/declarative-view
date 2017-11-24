require('./setup');

describe('Events', function () {
    it('on, off, trigger', function () {
		var view = new DeclarativeView();

		var cb = sinon.spy();

		view.on('test 2@!#@$%^&*():;.,/?! тест', cb);

		view.trigger('test', 1, 2);
		view.trigger('2@!#@$%^&*():;.,/?!', 'a', true, 3);
		view.trigger('тест');

		expect(cb).have.callCount(3);
		expect(cb).always.have.been.calledOn(view);
		expect(cb.getCall(0)).have.been.calledWith(1, 2);
		expect(cb.getCall(1)).have.been.calledWith('a', true, 3);
		expect(cb.getCall(2)).have.been.calledWith();
		
		view.off('тест');
		view.trigger('тест');

		expect(cb).have.callCount(3);
		
		view.trigger('test');

		expect(cb).have.callCount(4);
		
		view.off('2@!#@$%^&*():;.,/?!', function () {});
		view.trigger('2@!#@$%^&*():;.,/?!');

		expect(cb).have.callCount(5);
		
		view.off('2@!#@$%^&*():;.,/?!', cb);
		view.trigger('2@!#@$%^&*():;.,/?!');

		expect(cb).have.callCount(5);
		
		view.trigger('2@!#@$%^&*():;.,/?!');

		expect(cb).have.callCount(5);

		view.on('test2', cb);
		view.trigger('test');
		view.trigger('test2');

		expect(cb).have.callCount(7);

		view.off();
		view.trigger('test');
		view.trigger('test2');

		expect(cb).have.callCount(7);
	});

	it('should handle =prop, @prop, !event', function () {
		var view = new DeclarativeView({
			data: {
				prop: 'test'
			}
		});

		var cb = sinon.spy();

		view.on('=prop', cb);

		expect(cb).to.have.callCount(1);
		expect(cb).to.be.calledWith('test');
		expect(view.events).to.be.empty;

		view.on('!=prop', cb);

		expect(cb).to.have.callCount(2);
		expect(cb).to.be.calledWith(false);
		expect(view.events).to.be.empty;

		view.on('@prop', cb);
		expect(cb).to.have.callCount(3);
		expect(cb).to.be.calledWith('test');

		view.set('prop', 'test2');
		expect(cb).to.have.callCount(4);
		expect(cb).to.be.calledWith('test2');

		view.off();

		view.on('!@prop', cb);
		expect(cb).to.have.callCount(5);
		expect(cb).to.be.calledWith(false);
		view.set('prop', 0);
		expect(cb).to.have.callCount(6);
		expect(cb).to.be.calledWith(true);

		view.off();

		view.on('!event', cb);
		view.trigger('event', 1, 2, 3);
		expect(cb).to.have.callCount(7);
		expect(cb).to.be.calledWith(false, 1, 2, 3);
		view.trigger('event', 0);
		expect(cb).to.have.callCount(8);
		expect(cb).to.be.calledWith(true, 0);
	});

	it('should handle =sub.prop, @sub.prop', function () {
		var view = new DeclarativeView({
			data: {
				test: {
					users: [
						{
							name: 'value'
						},
						{
							name: 'value2'
						}
					]
				}
			}
		});

		var set = sinon.spy();
		view.on('=test.users.0.name', set);
		expect(set).to.have.callCount(1);
		expect(set).to.be.calledWith('value');
		expect(view.events).to.be.empty;
		view.on('@test.users.0.name', set);
		expect(set).to.have.callCount(2);
		expect(set).to.be.calledWith('value');
		view.set(['test', 'users', 0, 'name'], 'test');
		expect(set).to.have.callCount(3);
		expect(set).to.be.calledWith('test', 'value');

		view.on('!@test.users.1.name', set);
		expect(set).to.have.callCount(4);
		expect(set).to.be.calledWith(false, 'value2');
		view.set(['test', 'users', 1, 'name'], 'test');
		expect(set).to.have.callCount(5);
		expect(set).to.be.calledWith(false, 'test', 'value2');
		view.set(['test', 'users', 1, 'name'], '');
		expect(set).to.have.callCount(6);
		expect(set).to.be.calledWith(true, '', 'test');
	});

	it('should handle /prop event', function () {
		var cb = sinon.spy(function () {
			return this.data.prop + this.data.user.name;
		});

		var view = new DeclarativeView({
			data: {
				prop: 1,
				user: {
					name: 'value'
				}
			},
			template: {
				'@root': {
					text: {
						'> /prop /user.name': cb
					}
				}
			}
		});

		expect(cb).to.have.callCount(1);
		expect(cb).to.be.calledWith();
		expect(view.node).to.have.text('1value');

		view.set('prop', 2);
		expect(cb).to.have.callCount(2);
		expect(cb).to.be.calledWith(2, 1);
		expect(view.node).to.have.text('2value');

		view.model('user').set('name', 'test');
		expect(cb).to.have.callCount(3);
		expect(cb).to.be.calledWith('test', 'value');
		expect(view.node).to.have.text('2test');
	});

    it('listenOn, stopListening, listenOnce', function () {
		var view = new DeclarativeView();
		var node = view.node;

		var cb = sinon.spy();

		view.listenOn(node, 'test1 test2 test3', cb);

		node.trigger('test1', [1, 'a', true]);
		node.trigger('test2');
		node.trigger('test3');

		expect(cb).have.callCount(3);
		expect(cb).always.have.been.calledOn(view);
		expect(cb.getCall(0).args[0]).to.include.all.keys('target', 'currentTarget');
		expect(cb.getCall(0)).have.been.calledWith(cb.getCall(0).args[0], 1, 'a', true);

		view.stopListening(node, 'test3', cb);

		node.trigger('test3');
		expect(cb).have.callCount(3);
		node.trigger('test1');
		node.trigger('test2');
		expect(cb).have.callCount(5);

		view.stopListening(node, 'test2');

		node.trigger('test2');
		expect(cb).have.callCount(5);
		node.trigger('test1');
		expect(cb).have.callCount(6);

		view.stopListening(node);

		node.trigger('test1');
		expect(cb).have.callCount(6);

		view.listenOn(node, 'a b c', cb);

		node.trigger('a');
		node.trigger('b');
		node.trigger('c');
		expect(cb).have.callCount(9);

		view.stopListening();

		node.trigger('a');
		node.trigger('b');
		node.trigger('c');
		expect(cb).have.callCount(9);

		var span = DeclarativeView.$('<span>');
		node.append(span);

		view.listenOn(node, 'click', 'span', cb);
		span.trigger('click');

		expect(cb).have.callCount(10);

		view.stopListening();

		view.listenOn(node, 'click', 'li', cb);
		span.trigger('click');
		node.trigger('click');

		expect(cb).have.callCount(10);

		view.stopListening();

		var view2 = new DeclarativeView();
		view.listenOn(view2, 'test1 test2', cb);
		view2.trigger('test1', 'a', 1, true);

		expect(cb).have.callCount(11);
		expect(cb.getCall(10)).have.been.calledWith('a', 1, true);
		expect(cb.getCall(10)).have.been.calledOn(view);

		view.stopListening();
		view2.trigger('test1');
		view2.trigger('test2');

		expect(cb).have.callCount(11);

		view.listenOnce(view2, 'test1 test2', cb);
		view2.trigger('test1');

		expect(cb).have.callCount(12);

		view2.trigger('test1');

		expect(cb).have.callCount(12);

		view2.trigger('test2');

		expect(cb).have.callCount(13);

		view2.trigger('test2');

		expect(cb).have.callCount(13);

		expect(view.events).to.be.empty;
		expect(view.listeners).to.be.empty;
		expect(view2.events).to.be.empty;
		expect(view2.listeners).to.be.empty;
    });

    it('should handle > event', function () {
    	var view = new DeclarativeView({
			data: {
				prop1: 1,
				prop2: 2
			},

			template: {
				'@root': {
					text: {
						'> set/prop1 set/prop2': function () {
							return this.data.prop1 + this.data.prop2;
						}
					}
				}
			}
		});

    	var cb = sinon.spy();

    	view.on('> event', cb);
		expect(cb).to.have.callCount(1);
		view.trigger('event');
		expect(cb).to.have.callCount(2);

		expect(view.node).to.have.text('3');
		view.set('prop1', 3);
		expect(view.node).to.have.text('5');
		view.set('prop2', 4);
		expect(view.node).to.have.text('7');
    });
});