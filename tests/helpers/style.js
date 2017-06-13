describe('style helper', function () {
	it('should work', function () {
		var objectEvent1 = sinon.spy(function (x, y) {
			return x + y + 'px';
		});
		
		var testFunction = sinon.spy(function () {
			return '100px';
		});

		var functionIterator = sinon.spy(function (node, i) {
			expect(node).to.be.instanceOf(TemplateView.$);
			
			return i + 'px';
		});

		var eventIterator = sinon.spy(function () {
			return functionIterator;
		});

		var view = new TemplateView({
			node: '<div><div class="test" style="top: 0px; right: 0px; bottom: 0px; left: 0px;"></div><div class="iterator" style="width: 0px; height: 0px;"></div><div class="iterator" style="width: 0px; height: 0px;"></div></div>',

			data: {
				prop: '10px'
			},

			template: {
				'.test': {
					'style': {
						'top': 'event',
						'right': '=prop',
						'bottom': '@prop',
						'left': {
							'object-event-1': objectEvent1
						},
						'width': testFunction
					}
				},

				'.iterator': {
					'style': {
						'width': function () {
							return functionIterator;
						},
						'height': {
							'event-iterator': eventIterator
						}
					}
				}
			}
		});

		var test = view.find('.test');
		
		expect(test).to.have.css('top', '0px');
		expect(test).to.have.css('right', '10px');
		expect(test).to.have.css('bottom', '10px');
		expect(test).to.have.css('left', '0px');
		expect(test).to.have.css('width', '100px');
		expect(testFunction).to.have.callCount(1);
		expect(testFunction).to.be.calledOn(view);

		var iterator = view.find('.iterator');
		expect(functionIterator).to.have.callCount(2);
		expect(functionIterator).to.be.calledOn(view);
		expect(iterator.eq(0)).to.have.css('width', '0px');
		expect(iterator.eq(1)).to.have.css('width', '1px');

		view.trigger('event', '1px');
		expect(test).to.have.css('top', '1px');
		view.trigger('event', 2);
		expect(test).to.have.css('top', '2px');
		view.trigger('event');
		expect(test).to.have.css('top', '2px');
		
		view.set('prop', '2px');
		expect(test).to.have.css('right', '10px');
		expect(test).to.have.css('bottom', '2px');
		view.set('prop', 3);
		expect(test).to.have.css('bottom', '3px');

		view.trigger('object-event-1', 10, 20, 10);
		expect(objectEvent1).to.have.callCount(1);
		expect(objectEvent1).to.be.calledWith(10, 20, 10);
		expect(test).to.have.css('left', '30px');

		view.trigger('event-iterator', 'a', 1, true);
		expect(eventIterator).to.be.calledWith('a', 1, true);
		expect(functionIterator).to.have.callCount(4);
		expect(iterator.eq(0)).to.have.css('height', '0px');
		expect(iterator.eq(1)).to.have.css('height', '1px');
	});
});