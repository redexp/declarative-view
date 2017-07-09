(function () {
	var scope = this;

	function setup(
		chai,
		chaiJquery,
		sinonChai,
		sinon,
		jQuery,
		TemplateView
	) {
		scope.expect = chai.expect;
		scope.sinon = sinon;
		scope.jQuery = jQuery;
		scope.TemplateView = TemplateView;

		chai.use(chaiJquery);
		chai.use(sinonChai);
	}

	if (typeof define === 'function' && define.amd) {
		define('./setup', [
			'chai',
			'chai-jquery',
			'sinon-chai',
			'sinon',
			'jquery',
			'template-view'
		], setup);

		define('../setup', [], function () {
			require('./setup');
		});
	}
	else {
		var JSDOM = require("jsdom").JSDOM;
		var dom = new JSDOM();
		var jQuery = scope.jQuery = require('jquery')(dom.window);

		setup(
			require('chai'),
			require('chai-jquery'),
			require('sinon-chai'),
			require('sinon'),
			jQuery,
			require('../template-view')
		);
	}
})();