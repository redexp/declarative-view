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

		var functionIterator = sinon.spy(function (node, i) {
			expect(node).to.be.instanceOf(TemplateView.$);

			return i;
		});

		var eventIterator = sinon.spy(function () {
			return functionIterator;
		});

		var view = new TemplateView({
			node: '<div><div class="test"></div><div class="iterator"></div><div class="iterator"></div></div>',
			
			data: {
				prop: true
			},

			template: {
				'.test': {
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
				},
				
				'.iterator': {
					toggleClass: {
						'test-function-iterator': function () {
							return functionIterator;
						},
						'test-event-iterator': {
							'event-iterator': eventIterator
						}
					}
				}
			}
		});
		
		var node = view.find('.test');

		expect(node).not.to.have.class('test-event');
		expect(node).to.have.class('test-eq-prop');
		expect(node).to.have.class('test-a-prop');
		expect(node).not.to.have.class('test-object');
		expect(node).to.have.class('test-function');

		view.trigger('event', true);
		expect(node).to.have.class('test-event');
		view.trigger('event', false);
		expect(node).not.to.have.class('test-event');

		view.set('prop', false);
		expect(node).to.have.class('test-eq-prop');
		expect(node).not.to.have.class('test-a-prop');
		view.set('prop', true);
		expect(node).to.have.class('test-eq-prop');
		expect(node).to.have.class('test-a-prop');

		view.trigger('object-event-1', 0, 1);
		expect(node).to.have.class('test-object');
		expect(objectEvent1).to.be.calledWith(0, 1);
		view.trigger('object-event-1', 1, -1);
		expect(node).not.to.have.class('test-object');

		view.trigger('object-event-2', -1, -2);
		expect(node).to.have.class('test-object');
		view.trigger('object-event-2', 1, 1);
		expect(node).not.to.have.class('test-object');

		expect(node).not.to.have.class('test-event');
		expect(node).to.have.class('test-eq-prop');
		expect(node).to.have.class('test-a-prop');
		expect(node).not.to.have.class('test-object');
		expect(node).to.have.class('test-function');

		var iterator = view.find('.iterator');
		expect(functionIterator).to.have.callCount(2);
		expect(iterator.eq(0)).not.to.have.class('test-function-iterator');
		expect(iterator.eq(1)).to.have.class('test-function-iterator');

		iterator.addClass('test-event-iterator');
		view.trigger('event-iterator');
		expect(functionIterator).to.have.callCount(4);
		expect(iterator.eq(0)).not.to.have.class('test-event-iterator');
		expect(iterator.eq(1)).to.have.class('test-function-iterator');
	});
});