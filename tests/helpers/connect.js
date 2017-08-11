require('../setup');

describe('connect helper', function () {
	it('should work', function () {
		var view = new DeclarativeView({
			data: {
				prop1: 'value1',
				prop2: 'value2'
			},

			template: {
				'@root': {
					connect: {
						'test1': 'prop1',
						'test2|click': 'prop2'
					}
				}
			}
		});

		expect(view.node).to.have.prop('test1', 'value1');
		expect(view.node).to.have.prop('test2', 'value2');
		view.set('prop1', 'value3');
		expect(view.node).to.have.prop('test1', 'value3');
		expect(view.node).to.have.prop('test2', 'value2');
		view.node.prop('test1', 'value4').trigger('change');
		expect(view.get('prop1')).to.equal('value4');
		expect(view.get('prop2')).to.equal('value2');
		view.node.prop('test2', 'value5').trigger('click');
		expect(view.get('prop1')).to.equal('value4');
		expect(view.get('prop2')).to.equal('value5');
	});

	it('should handle path', function () {
		var view = new DeclarativeView({
			data: {
				test: {
					user: {
						name: 'value'
					}
				}
			},

			template: {
				'@root': {
					connect: {
						'id': 'test.user.name'
					}
				}
			}
		});

		expect(view.node).to.have.prop('id', 'value');
		view.node.prop('id', 'value2').change();
		expect(view.data.test.user.name).to.equal('value2');
	});
});