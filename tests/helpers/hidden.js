require('../setup');

describe('hidden', function () {
	it('should hide when value is false', function () {
		var view = new DeclarativeView({
			node: '<div style="">',

			data: {
				test: {
					prop: 'value'
				}
			},

			template: {
				'@root': {
					hidden: '@test.prop'
				}
			}
		});

		expect(view.node.css('display')).to.equal('none');
		view.model('test').set('prop', '');
		expect(view.node.css('display')).not.equal('none');
		view.model('test').set('prop', true);
		expect(view.node.css('display')).to.equal('none');
	});
});