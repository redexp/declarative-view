require('./setup');

describe('find', function () {
	it('should replace @ui to node selector', function () {
		var view = new DeclarativeView({
			node: '<div><div class="inner"><div class="test"><div class="asd"></div></div></div><div class="test"><div class="asd"></div></div></div>',

			ui: {
				test: '@inner > .test',
				inner: '@root > .inner'
			}
		});

		var node = view.find('@test > .asd');
		expect(node.length).to.equal(1);
		expect(node.get(0)).to.equal(view.node.find('> .inner > .test > .asd').get(0));
	});
});