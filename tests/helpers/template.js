require('../setup');

describe('template helper', function () {
    it('should work', function () {
		var view = new TemplateView({
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
});