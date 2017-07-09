require('../setup');

describe('text helper', function () {
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
					'text': 'event'
				},
				'.eq-prop': {
					'text': '=prop'
				},
				'.a-prop': {
					'text': '@prop'
				},
				'.object': {
					'text': {
						'object-event': objectEvent
					}
				},
				'.func': {
					text: testFunction
				},

				'.iterator': {
					'text': {
						'event-iterator': eventIterator
					}
				}
			}
		});

		expect(view.find('.event')).to.have.text('');
		view.trigger('event', '<i>test</i>');
		expect(view.find('.event')).to.have.text('<i>test</i>');
		view.trigger('event', '');
		expect(view.find('.event')).to.have.text('');

		expect(view.find('.eq-prop')).to.have.text('<span>test</span>');
		expect(view.find('.a-prop')).to.have.text('<span>test</span>');
		view.set('prop', '<b>test</b>');
		expect(view.find('.eq-prop')).to.have.text('<span>test</span>');
		expect(view.find('.a-prop')).to.have.text('<b>test</b>');

		expect(view.find('.object')).to.have.text('');
		view.trigger('object-event', 1, 2);
		expect(view.find('.object')).to.have.text('<span>3</span>');
		expect(objectEvent).to.have.callCount(1);
		expect(objectEvent).to.be.calledOn(view);

		expect(view.find('.func')).to.have.text('<p></p>');
		expect(testFunction).to.have.callCount(1);
		expect(testFunction).to.be.calledOn(view);

		expect(view.find('.iterator').eq(0)).to.have.text('');
		expect(view.find('.iterator').eq(1)).to.have.text('');
		view.trigger('event-iterator');
		expect(view.find('.iterator').eq(0)).to.have.text('<i>0</i>');
		expect(view.find('.iterator').eq(1)).to.have.text('<i>1</i>');
		expect(eventIterator).to.have.callCount(1);
		expect(eventIterator).to.be.calledOn(view);
		expect(functionIterator).to.have.callCount(2);
		expect(functionIterator).to.be.calledOn(view);
	});
});