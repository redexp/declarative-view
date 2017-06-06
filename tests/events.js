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
});