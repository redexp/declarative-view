describe('get, set', function () {
	it('should work', function () {
		var view = new TemplateView({
			data: {
				prop: 'test'
			}
		});

		expect(view.get('prop')).to.equal('test');

		var changeProp = sinon.spy();
		var change = sinon.spy();

		view.on('change:prop', changeProp);
		view.on('change', change);

		view.set('prop', 'value');

		expect(view.get('prop')).to.equal('value');
		expect(changeProp).to.have.callCount(1);
		expect(changeProp).to.be.calledWith('value', 'test');
		expect(change).to.have.callCount(1);
		expect(change).to.be.calledWith('prop', 'value', 'test');

		view.set('prop', 'value');
		expect(changeProp).to.have.callCount(1);
		expect(change).to.have.callCount(1);

		view.set('test', 1);
		expect(changeProp).to.have.callCount(1);
		expect(change).to.have.callCount(2);
		expect(change).to.be.calledWith('test', 1, undefined);
	});
});