require('./setup');

describe('extend', function () {
	it('should work', function () {
		var View = TemplateView.extend({
			node: '<div><div class="test"></div><div class="active"></div></div>',

			ui: {
				test: '.test'
			},

			data: {
				prop: 'value'
			},

			test: function () {},

			template: {
				'@test': {
					text: '=prop'
				}
			}
		});

		function Test(ops) {
			View.call(this, ops);
		}

		View.extend({
			constructor: Test,

			ui: {
				active: '.active'
			},

			data: {
				prop: 'test',
				active: false
			},

			method: function () {},

			template: {
				'@test': {
					toggleClass: {
						'test': function () {
							return false;
						}
					}
				},

				'@active': {
					toggleClass: {
						'active': '@active'
					}
				}
			}
		});

		var test = new Test();

		expect(test.ui).to.have.all.keys('root', 'test', 'active');
		expect(test.data).to.have.all.keys('prop', 'active');
		expect(test.template).to.have.all.keys('@test', '@active');
		expect(test.ui.test).to.have.text('test');
		expect(test.ui.test).not.to.have.class('test');
		expect(test.ui.active).not.to.have.class('active');
		expect(test.test).to.be.a('function');
		expect(test.method).to.be.a('function');

		var view = new View();

		expect(view.ui).to.have.all.keys('root', 'test');
		expect(view.data).to.have.all.keys('prop');
		expect(view.template).to.have.all.keys('@test');
		expect(view.ui.test).to.have.text('value');
		expect(view.find('.test, .active').length).to.equal(2);
		expect(view.test).to.be.a('function');
		expect(view.method).to.be.an('undefined');
	});
});