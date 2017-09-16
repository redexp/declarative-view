require('../setup');

describe('on, once helpers', function () {
	it('on', function () {
		var testCb = sinon.spy();
		var clickCb = sinon.spy();
		var spanCb = sinon.spy();

		var View = DeclarativeView.extend({
			node: '<div><span></span><input type="text"/></div>',

			test: testCb,

			template: {
				'@root': {
					on: {
						'click': clickCb,
						'test': 'test',
						'change': {
							'span': spanCb,
							'input': 'test'
						}
					}
				}
			}
		});

		var view = new View();

		expect(testCb).to.have.callCount(0);
		expect(clickCb).to.have.callCount(0);
		expect(spanCb).to.have.callCount(0);

		view.node.click();
		expect(testCb).to.have.callCount(0);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(0);
		expect(clickCb.getCall(0).args[0]).to.have.property('target', view.node.get(0));
		expect(clickCb).to.be.calledOn(view);

		view.node.trigger('test', [1, 2]);
		expect(testCb).to.have.callCount(1);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(0);
		expect(testCb.getCall(0).args[0]).to.have.property('target', view.node.get(0));
		expect(testCb).to.be.calledWith(testCb.getCall(0).args[0], 1, 2);
		expect(testCb).to.be.calledOn(view);

		view.node.trigger('change');
		expect(testCb).to.have.callCount(1);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(0);

		view.find('span').trigger('change', ['a', true]);
		expect(testCb).to.have.callCount(1);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(1);
		expect(spanCb.getCall(0).args[0]).to.have.property('target', view.find('span').get(0));
		expect(spanCb.getCall(0).args[0]).to.have.property('delegateTarget', view.node.get(0));
		expect(spanCb).to.be.calledWith(spanCb.getCall(0).args[0], 'a', true);
		expect(spanCb).to.be.calledOn(view);

		view.find('input').trigger('change', [false, null]);
		expect(testCb).to.have.callCount(2);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(1);
		expect(testCb.getCall(1).args[0]).to.have.property('target', view.find('input').get(0));
		expect(testCb.getCall(1).args[0]).to.have.property('delegateTarget', view.node.get(0));
		expect(testCb).to.be.calledWith(testCb.getCall(1).args[0], false, null);
		expect(testCb).to.be.calledOn(view);

		view.node.click();
		expect(testCb).to.have.callCount(2);
		expect(clickCb).to.have.callCount(2);
		expect(spanCb).to.have.callCount(1);
		view.node.trigger('test');
		expect(testCb).to.have.callCount(3);
		expect(clickCb).to.have.callCount(2);
		expect(spanCb).to.have.callCount(1);
		view.find('span').trigger('change');
		expect(testCb).to.have.callCount(3);
		expect(clickCb).to.have.callCount(2);
		expect(spanCb).to.have.callCount(2);
		view.find('input').trigger('change');
		expect(testCb).to.have.callCount(4);
		expect(clickCb).to.have.callCount(2);
		expect(spanCb).to.have.callCount(2);

		view.stopListening(view.node);
		view.node.trigger('click');
		view.node.trigger('test');
		view.find('span').trigger('change');
		view.find('input').trigger('change');
		expect(testCb).to.have.callCount(4);
		expect(clickCb).to.have.callCount(2);
		expect(spanCb).to.have.callCount(2);

		expect(view.listeners).to.be.empty;
	});

	it('once', function () {
		var testCb = sinon.spy();
		var clickCb = sinon.spy();
		var spanCb = sinon.spy();

		var View = DeclarativeView.extend({
			node: '<div><span></span><input type="text"/></div>',

			test: testCb,

			template: {
				'@root': {
					once: {
						'click': clickCb,
						'test': 'test',
						'change': {
							'span': spanCb,
							'input': 'test'
						}
					}
				}
			}
		});

		var view = new View();

		expect(testCb).to.have.callCount(0);
		expect(clickCb).to.have.callCount(0);
		expect(spanCb).to.have.callCount(0);

		view.node.click();
		expect(testCb).to.have.callCount(0);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(0);
		expect(clickCb.getCall(0).args[0]).to.have.property('target', view.node.get(0));
		expect(clickCb).to.be.calledOn(view);
		view.node.click();
		expect(testCb).to.have.callCount(0);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(0);

		view.node.trigger('test', [1, 2]);
		expect(testCb).to.have.callCount(1);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(0);
		expect(testCb.getCall(0).args[0]).to.have.property('target', view.node.get(0));
		expect(testCb).to.be.calledWith(testCb.getCall(0).args[0], 1, 2);
		expect(testCb).to.be.calledOn(view);
		view.node.trigger('test');
		expect(testCb).to.have.callCount(1);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(0);

		view.node.trigger('change');
		expect(testCb).to.have.callCount(1);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(0);

		view.find('span').trigger('change', ['a', true]);
		expect(testCb).to.have.callCount(1);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(1);
		expect(spanCb.getCall(0).args[0]).to.have.property('target', view.find('span').get(0));
		expect(spanCb.getCall(0).args[0]).to.have.property('delegateTarget', view.node.get(0));
		expect(spanCb).to.be.calledWith(spanCb.getCall(0).args[0], 'a', true);
		expect(spanCb).to.be.calledOn(view);
		view.find('span').trigger('change');
		expect(testCb).to.have.callCount(1);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(1);

		view.find('input').trigger('change', [false, null]);
		expect(testCb).to.have.callCount(2);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(1);
		expect(testCb.getCall(1).args[0]).to.have.property('target', view.find('input').get(0));
		expect(testCb.getCall(1).args[0]).to.have.property('delegateTarget', view.node.get(0));
		expect(testCb).to.be.calledWith(testCb.getCall(1).args[0], false, null);
		expect(testCb).to.be.calledOn(view);
		view.find('input').trigger('change');
		expect(testCb).to.have.callCount(2);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(1);

		expect(view.listeners).to.be.empty;

		view.node.trigger('click');
		view.node.trigger('test');
		view.find('span').trigger('change');
		view.find('input').trigger('change');
		expect(testCb).to.have.callCount(2);
		expect(clickCb).to.have.callCount(1);
		expect(spanCb).to.have.callCount(1);
	});

	it('click', function () {
		var click = sinon.spy();

		var view = new DeclarativeView({
			template: {
				'@root': {
					click: click
				}
			}
		});

		view.node.click();

		expect(click).to.have.callCount(1);
	});
});