describe('class helper', function () {
	it('should work', function () {
		var objectEvent1 = sinon.spy(function (x, y) {
			return x + y;
		});

		var objectEvent2 = sinon.spy(function (x, y) {
			return x - y;
		});

		var testFunction = sinon.spy(function () {
			return true;
		});

		var view = new TemplateView({
			data: {
				prop: true
			},

			template: {
				'@root': {
					'class': {
						'test-event': 'event',
						'test-eq-prop': '=prop',
						'test-a-prop': '@prop',
						'test-object': {
							'object-event-1': objectEvent1,
							'object-event-2': objectEvent2
						},
						'test-function': testFunction
					}
				}
			}
		});

		expect(view.node).not.to.have.class('test-event');
		expect(view.node).to.have.class('test-eq-prop');
		expect(view.node).to.have.class('test-a-prop');
		expect(view.node).not.to.have.class('test-object');
		expect(view.node).to.have.class('test-function');

		view.trigger('event', true);
		expect(view.node).to.have.class('test-event');
		view.trigger('event', false);
		expect(view.node).not.to.have.class('test-event');

		view.set('prop', false);
		expect(view.node).to.have.class('test-eq-prop');
		expect(view.node).not.to.have.class('test-a-prop');
		view.set('prop', true);
		expect(view.node).to.have.class('test-eq-prop');
		expect(view.node).to.have.class('test-a-prop');

		view.trigger('object-event-1', 0, 1);
		expect(view.node).to.have.class('test-object');
		expect(objectEvent1).to.be.calledWith(0, 1);
		view.trigger('object-event-1', 1, -1);
		expect(view.node).not.to.have.class('test-object');

		view.trigger('object-event-2', -1, -2);
		expect(view.node).to.have.class('test-object');
		view.trigger('object-event-2', 1, 1);
		expect(view.node).not.to.have.class('test-object');

		expect(view.node).not.to.have.class('test-event');
		expect(view.node).to.have.class('test-eq-prop');
		expect(view.node).to.have.class('test-a-prop');
		expect(view.node).not.to.have.class('test-object');
		expect(view.node).to.have.class('test-function');
	});
});