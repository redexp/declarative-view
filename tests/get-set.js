require('./setup');

describe('get, set', function () {
	it('should work', function () {
		var view = new DeclarativeView({
			data: {
				prop: 'test'
			}
		});

		expect(view.get('prop')).to.equal('test');

		var setProp = sinon.spy();
		var set = sinon.spy();

		view.on('set/prop', setProp);
		view.on('set', set);

		view.set('prop', 'value');

		expect(view.get('prop')).to.equal('value');
		expect(setProp).to.have.callCount(1);
		expect(setProp).to.be.calledWith('value', 'test');
		expect(set).to.have.callCount(1);
		expect(set).to.be.calledWith('prop', 'value', 'test');

		view.set('prop', 'value');
		expect(setProp).to.have.callCount(1);
		expect(set).to.have.callCount(1);

		view.set('test', 1);
		expect(setProp).to.have.callCount(1);
		expect(set).to.have.callCount(2);
		expect(set).to.be.calledWith('test', 1, undefined);
	});

	it('should handle array of props', function () {
		var view = new DeclarativeView({
			data: {
				test: {
					users: [
						{
							name: 'value'
						}
					]
				}
			}
		});

		expect(view.get(['test', 'users', 0, 'name'])).to.equal('value');
		view.set(['test', 'users', 0, 'name'], 'test');
		expect(view.get(['test', 'users', 0, 'name'])).to.equal('test');
	});

	it('should handle object of props', function () {
		var view = new DeclarativeView({
			data: {
				prop1: 'value1',
				prop2: 'value2'
			}
		});

		var set = sinon.spy();
		view.on('set', set);
		view.set({
			prop1: 'test1',
			prop2: 'test2',
			prop3: 'test3'
		});
		expect(set).to.have.callCount(3);
		expect(set).to.be.always.calledOn(view);
		expect(set.getCall(0)).to.be.calledWith('prop1', 'test1', 'value1');
		expect(set.getCall(1)).to.be.calledWith('prop2', 'test2', 'value2');
		expect(set.getCall(2)).to.be.calledWith('prop3', 'test3', undefined);
	});
});