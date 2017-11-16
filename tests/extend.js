require('./setup');

describe('extend', function () {
	it('should work', function () {
		var View = DeclarativeView.extend({
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

	it('ui, data, template as function', function () {
		var View = DeclarativeView.extend({
			ui: function () {
				return {
					ui1: 'div'
				};
			},

			data: function () {
				return {
					data1: 'value1'
				};
			},

			template: function () {
				return {
					'@root': {
						text: '=data1'
					}
				};
			}
		});

		var Test = View.extend({
			ui: function () {
				return {
					ui2: 'div'
				};
			},

			data: function () {
				return {
					data2: 'value2'
				};
			},

			template: function () {
				return {
					'@root': {
						html: '=data2'
					}
				};
			}
		});

		var view = new Test({
			ui: {
				ui3: 'div'
			},

			data: {
				data3: 'value3'
			},

			template: {
				'@root': {
					prop: {
						'id': 'data3'
					}
				}
			}
		});

		expect(view.ui).to.have.all.keys('root', 'ui1', 'ui2', 'ui3');
		expect(view.data).to.eql({
			data1: 'value1',
			data2: 'value2',
			data3: 'value3'
		});
		expect(view.template).to.eql({
			'@root': {
				text: '=data1',
				html: '=data2',
				prop: {
					'id': 'data3'
				}
			}
		});
	});

	it('should have options.data on extend data', function () {
		var View = DeclarativeView.extend({
			constructor: function (options) {
				this.data = {name: 'value1'};

				DeclarativeView.call(this, options);
			},

			data: function () {
				return {
					test1: this.data.name + 'Test',
					test2: this.data.user + 'Test',
					users: []
				};
			}
		});

		var view = new View({
			data: {
				user: 'value2',
				users: [1, 2]
			}
		});

		expect(view.data.name).to.equal('value1');
		expect(view.data.user).to.equal('value2');
		expect(view.data.test1).to.equal('value1Test');
		expect(view.data.test2).to.equal('value2Test');
		expect(view.data.users).to.eql([1, 2]);
	});
});