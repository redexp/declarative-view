require('../setup');

describe('template helper', function () {
    it('should work', function () {
		var view = new DeclarativeView({
			node: '<div><div class="test"><div class="inner"></div></div><div class="test text"></div></div>',
			template: {
				'@root': {
					'& .test': {
						template: {
							'&.text': {
								text: function () {
									return 'text';
								}
							},

							'.inner': {
								text: function () {
									return 'inner';
								}
							}
						}
					}
				}
			}
		});

		expect(view.find('.test.text')).to.have.text('text');
		expect(view.find('.test .inner')).to.have.text('inner');
    });

    it('should handle helpers and it options as function', function () {
    	var view = new DeclarativeView({
			template: {
				'@root': function () {
					expect(this).to.be.instanceOf(DeclarativeView);

					return {
						attr: {
							test: function () {
								expect(this).to.be.instanceOf(DeclarativeView);

								return 'value';
							}
						}
					}
				}
			}
		});

    	expect(view.node).to.have.attr('test', 'value');
    });
});