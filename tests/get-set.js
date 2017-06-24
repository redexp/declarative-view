describe('get, set', function () {
	it('should work', function () {
		var view = new TemplateView({
			data: {
				prop: 'test'
			}
		});

		expect(view.get('prop')).to.equal('test');

		var setProp = sinon.spy();
		var setAll = sinon.spy();
		var set = sinon.spy();

		view.on('set/prop', setProp);
		view.on('set/*', setAll);
		view.on('set', set);

		view.set('prop', 'value');

		expect(view.get('prop')).to.equal('value');
		expect(setProp).to.have.callCount(1);
		expect(setProp).to.be.calledWith('value', 'test');
		expect(setAll).to.have.callCount(1);
		expect(setAll).to.be.calledWith([], 'prop', 'value', 'test');
		expect(set).to.have.callCount(1);
		expect(set).to.be.calledWith('prop', 'value', 'test');

		view.set('prop', 'value');
		expect(setProp).to.have.callCount(1);
		expect(setAll).to.have.callCount(1);
		expect(set).to.have.callCount(1);

		view.set('test', 1);
		expect(setProp).to.have.callCount(1);
		expect(setAll).to.have.callCount(2);
		expect(setAll).to.be.calledWith([], 'test', 1, undefined);
		expect(set).to.have.callCount(2);
		expect(set).to.be.calledWith('test', 1, undefined);
	});
});