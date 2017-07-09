require('../setup');

describe('html helper', function () {
	it('should work', function () {
		var objectEvent = sinon.spy(function (x, y) {
			return '<span>' + (x + y) + '</span>';
		});

		var testFunction = sinon.spy(function () {
			return '<p></p>';
		});

		var functionIterator = sinon.spy(function (node, i) {
			expect(node).to.be.instanceOf(DeclarativeView.$);

			return '<i>' + i + '</i>';
		});

		var eventIterator = sinon.spy(function () {
			return functionIterator;
		});

		var view = new DeclarativeView({
			node: '<div>' +
			'<div class="event"></div>' +
			'<div class="eq-prop"></div>' +
			'<div class="a-prop"></div>' +
			'<div class="object"></div>' +
			'<div class="func"></div>' +
			'<div class="iterator"></div>' +
			'<div class="iterator"></div>' +
			'</div>',

			data: {
				prop: '<span>test</span>'
			},

			template: {
				'.event': {
					'html': 'event'
				},
				'.eq-prop': {
					'html': '=prop'
				},
				'.a-prop': {
					'html': '@prop'
				},
				'.object': {
					'html': {
						'object-event': objectEvent
					}
				},
				'.func': {
					html: testFunction
				},

				'.iterator': {
					'html': {
						'event-iterator': eventIterator
					}
				}
			}
		});

		expect(view.find('.event')).to.have.html('');
		view.trigger('event', '<i>test</i>');
		expect(view.find('.event')).to.have.html('<i>test</i>');
		view.trigger('event', '');
		expect(view.find('.event')).to.have.html('');

		expect(view.find('.eq-prop')).to.have.html('<span>test</span>');
		expect(view.find('.a-prop')).to.have.html('<span>test</span>');
		view.set('prop', '<b>test</b>');
		expect(view.find('.eq-prop')).to.have.html('<span>test</span>');
		expect(view.find('.a-prop')).to.have.html('<b>test</b>');

		expect(view.find('.object')).to.have.html('');
		view.trigger('object-event', 1, 2);
		expect(view.find('.object')).to.have.html('<span>3</span>');
		expect(objectEvent).to.have.callCount(1);
		expect(objectEvent).to.be.calledOn(view);

		expect(view.find('.func')).to.have.html('<p></p>');
		expect(testFunction).to.have.callCount(1);
		expect(testFunction).to.be.calledOn(view);

		expect(view.find('.iterator').eq(0)).to.have.html('');
		expect(view.find('.iterator').eq(1)).to.have.html('');
		view.trigger('event-iterator');
		expect(view.find('.iterator').eq(0)).to.have.html('<i>0</i>');
		expect(view.find('.iterator').eq(1)).to.have.html('<i>1</i>');
		expect(eventIterator).to.have.callCount(1);
		expect(eventIterator).to.be.calledOn(view);
		expect(functionIterator).to.have.callCount(2);
		expect(functionIterator).to.be.calledOn(view);
	});
});