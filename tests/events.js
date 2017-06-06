describe('Events', function () {
    it('on, off, trigger', function () {
		var view = new TemplateView();

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

    it('listenOn, stopListening', function () {
		var view = new TemplateView();
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

		var span = TemplateView.$('<span>');
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

		var view2 = new TemplateView();
		view.listenOn(view2, 'test1 test2', cb);
		view2.trigger('test1', 'a', 1, true);

		expect(cb).have.callCount(11);
		expect(cb.getCall(10)).have.been.calledWith('a', 1, true);
		expect(cb.getCall(10)).have.been.calledOn(view);

		view.stopListening();
		view2.trigger('test1');
		view2.trigger('test2');

		expect(cb).have.callCount(11);
    });
});