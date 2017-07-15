require('./setup');

describe('ui', function () {
	it('should handle ui names in selectors', function () {
		var view = new DeclarativeView({
			node: '<div><div class="inner"><div class="test"></div></div><div class="test"></div></div>',

			ui: {
				test: '@inner > .test',
				inner: '@root > .inner',
				span: '<span class="ui-div">'
			}
		});

		expect(view.ui.test.length).to.equal(1);
		expect(view.ui.test.get(0)).to.equal(view.node.find('> .inner > .test').get(0));

		expect(view.ui.inner.length).to.equal(1);
		expect(view.ui.inner.get(0)).to.equal(view.node.find('> .inner').get(0));

		expect(view.ui.span.length).to.equal(1);
		expect(view.ui.span).to.match('span.ui-div');

		expect(view.ui.root.length).to.equal(1);
		expect(view.ui.root.get(0)).to.equal(view.node.get(0));
	});
});