describe('attr helper', function () {
	it('should work', function () {
		var objectEvent1 = sinon.spy(function (x, y) {
			return x + y;
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
				prop: 'test'
			},

			template: {
				'.test': {
					'attr': {
						'test-event': 'event',
						'test-eq-prop': '=prop',
						'test-a-prop': '@prop',
						'test-object': {
							'object-event-1': objectEvent1
						},
						'test-function': testFunction
					}
				},

				'.iterator': {
					'attr': {
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

		var test = view.find('.test');
		
		expect(test).not.to.have.attr('test-event');
		expect(test).to.have.attr('test-eq-prop', 'test');
		expect(test).to.have.attr('test-a-prop', 'test');
		expect(test).not.to.have.attr('test-object');
		expect(test).to.have.attr('test-function');
		expect(testFunction).to.have.callCount(1);
		expect(testFunction).to.be.calledOn(view);

		var iterator = view.find('.iterator');
		expect(functionIterator).to.have.callCount(2);
		expect(functionIterator).to.be.calledOn(view);
		expect(iterator.eq(0)).to.have.attr('test-function-iterator', '0');
		expect(iterator.eq(1)).to.have.attr('test-function-iterator', '1');

		view.trigger('event', 'value1');
		expect(test).to.have.attr('test-event', 'value1');
		view.trigger('event', 'value2');
		expect(test).to.have.attr('test-event', 'value2');
		view.trigger('event', null);
		expect(test).not.to.have.attr('test-event');
		view.trigger('event', 'test');
		view.trigger('event');
		expect(test).to.have.attr('test-event', 'test');
		
		view.set('prop', 'value1');
		expect(test).to.have.attr('test-eq-prop', 'test');
		expect(test).to.have.attr('test-a-prop', 'value1');
		view.set('prop', 'value2');
		expect(test).to.have.attr('test-a-prop', 'value2');
		view.set('prop', null);
		expect(test).not.to.have.attr('test-a-prop');
		
		view.trigger('object-event-1', 1, 2, 10);
		expect(objectEvent1).to.have.callCount(1);
		expect(objectEvent1).to.be.calledWith(1, 2, 10);
		expect(test).to.have.attr('test-object', '3');
		view.trigger('object-event-1', 'asd', 'qwe');
		expect(test).to.have.attr('test-object', 'asdqwe');

		view.trigger('event-iterator', 'a', 1, true);
		expect(eventIterator).to.be.calledWith('a', 1, true);
		expect(functionIterator).to.have.callCount(4);
	});
});