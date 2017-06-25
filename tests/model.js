describe('model', function () {
	it('object model', function () {
		var view = new TemplateView({
			data: {
				test: {
					prop: {
						name: 'value'
					}
				},
				users: [
					{
						name: 'test'
					}
				]
			}
		});

		expect(view.model('test').model('prop').get('name')).to.equal('value');
		expect(view.model('users').model(0).get('name')).to.equal('test');

		var setPropName = sinon.spy();
		var setPropAll = sinon.spy();
		var setAll = sinon.spy();
		view.on('set/test.prop.name', setPropName);
		view.on('set/test.prop.*', setPropAll);
		view.on('set/*', setAll);
		view.model('test').model('prop').set('name', 'test');
		expect(setPropName).to.have.callCount(1);
		expect(setPropName).to.be.calledOn(view);
		expect(setPropAll).to.have.callCount(1);
		expect(setPropAll).to.be.calledWith('name', 'test', 'value');
		expect(setAll).to.have.callCount(1);
		expect(setAll).to.be.calledOn(view);
		expect(setAll).to.be.calledWith(['test', 'prop'], 'name', 'test', 'value');

		var setProp = sinon.spy();
		view.on('set/test.prop', setProp);
		view.model('test').set('prop', {name: 'asd'});
		expect(setPropName).to.have.callCount(1);
		expect(setProp).to.have.callCount(1);
		expect(setProp).to.be.calledWith({name: 'asd'}, {name: 'test'});
		expect(setAll).to.have.callCount(2);
		expect(setAll).to.be.calledWith(['test'], 'prop', {name: 'asd'}, {name: 'test'});
		expect(view.model('test').model('prop').get('name')).to.equal('asd');

		view.model('test').model('prop').set('name', 'qwe');
		expect(setPropName).to.have.callCount(2);
		expect(setPropName).to.be.calledWith('qwe', 'asd');
		expect(setProp).to.have.callCount(1);
		expect(setAll).to.have.callCount(3);
		expect(setAll).to.be.calledWith(['test', 'prop'], 'name', 'qwe', 'asd');

		var setUsersName = sinon.spy();
		view.on('set/users.0.name', setUsersName);
		view.model('users').model(0).set('name', 'value');
		expect(setUsersName).to.have.callCount(1);
		expect(setPropName).to.have.callCount(2);
		expect(setProp).to.have.callCount(1);
		expect(setAll).to.have.callCount(4);
		expect(setUsersName).to.be.calledWith('value', 'test');
		expect(setAll).to.be.calledWith(['users', 0], 'name', 'value', 'test');
	});

	it('array model', function () {
		var view = new TemplateView({
			data: {
				test: {
					users: [
						{
							name: 'value'
						}
					]
				}
			}
		});

		var addUsers = sinon.spy();
		var addAll = sinon.spy();
		view.on('add/test.users', addUsers);
		view.on('add/*', addAll);
		view.model('test').model('users').add({name: 'value2'});
		expect(addUsers).to.have.callCount(1);
		expect(addUsers).to.be.calledWith({name: 'value2'}, 1);
		view.model('test').model('users').add({name: 'value3'});
		expect(addUsers).to.be.calledWith({name: 'value3'}, 2);
		view.model('test').model('users').add({name: 'value4'}, 0);
		expect(addUsers).to.be.calledWith({name: 'value4'}, 0);
		expect(view.model('test').model('users').model(0).get('name')).to.be.equal('value4');
		expect(view.model('test').model('users').length()).to.be.equal(4);
		expect(addAll).to.have.callCount(3);
		expect(addAll).to.be.calledWith(['test', 'users'], {name: 'value4'}, 0);

		var removeUsers = sinon.spy();
		var removeAll = sinon.spy();
		view.on('remove/test.users', removeUsers);
		view.on('remove/*', removeAll);
		view.model('test').model('users').remove(view.data.test.users[3]);
		expect(removeUsers).to.be.calledWith({name: 'value3'}, 3);
		expect(removeAll).to.be.calledWith(['test', 'users'], {name: 'value3'}, 3);
		view.model('test').model('users').removeAt(0);
		expect(removeUsers).to.be.calledWith({name: 'value4'}, 0);
		expect(removeAll).to.be.calledWith(['test', 'users'], {name: 'value4'}, 0);

		view.model('test').model('users').replace(view.data.test.users[1], {name: 'test'});
		expect(removeUsers).to.be.calledWith({name: 'value2'}, 1);
		expect(removeAll).to.be.calledWith(['test', 'users'], {name: 'value2'}, 1);
		expect(addUsers).to.be.calledWith({name: 'test'}, 1);
		expect(addAll).to.be.calledWith(['test', 'users'], {name: 'test'}, 1);
		view.model('test').model('users').replaceAt(0, {name: 'test2'});
		expect(removeUsers).to.be.calledWith({name: 'value'}, 0);
		expect(removeAll).to.be.calledWith(['test', 'users'], {name: 'value'}, 0);
		expect(addUsers).to.be.calledWith({name: 'test2'}, 0);
		expect(addAll).to.be.calledWith(['test', 'users'], {name: 'test2'}, 0);

		expect(view.data.test.users).to.eql([{name: 'test2'}, {name: 'test'}]);

		view.model('test').model('users').add([{name: 'add1'}, {name: 'add2'}, {name: 'add3'}], 1);
		expect(addUsers).to.be.calledWith({name: 'add3'}, 3);
		expect(view.data.test.users).to.eql([{name: 'test2'}, {name: 'add1'}, {name: 'add2'}, {name: 'add3'}, {name: 'test'}]);

		var removeAllUsers = sinon.spy();
		view.on('remove/test.users', removeAllUsers);
		view.model('test').model('users').removeAll();
		expect(view.data.test.users.length).to.equal(0);
		expect(removeAllUsers).to.have.callCount(5);
		expect(removeAllUsers.getCall(0)).to.be.calledWith({name: 'test'}, 4);
		expect(removeAllUsers.getCall(1)).to.be.calledWith({name: 'add3'}, 3);
		expect(removeAllUsers.getCall(2)).to.be.calledWith({name: 'add2'}, 2);
		expect(removeAllUsers.getCall(3)).to.be.calledWith({name: 'add1'}, 1);
		expect(removeAllUsers.getCall(4)).to.be.calledWith({name: 'test2'}, 0);

		expect(view.wrappers.sources.length).to.equal(2);
		expect(view.wrappers.targets.length).to.equal(2);
		expect(view.wrappers.sources[0]).to.equal(view.data.test);
		expect(view.wrappers.sources[1]).to.equal(view.data.test.users);

		view.model('test').model('users').add([{prop: {name: 'value1'}}, {prop: {name: 'value2'}}, {prop: {name: 'value3'}}]);
		view.model('test').model('users').model(0).model('prop');
		view.model('test').model('users').model(1).model('prop');
		view.model('test').model('users').model(2).model('prop');
		expect(view.wrappers.sources.length).to.equal(8);
		expect(view.wrappers.targets.length).to.equal(8);
		expect(view.model('test').model('users').model(0).model('prop').get('name')).to.equal('value1');
		expect(view.data.test.users[0].prop.name).to.equal('value1');
		view.model('test').model('users').removeAt(0);
		expect(view.model('test').model('users').model(0).model('prop').get('name')).to.equal('value2');
		expect(view.data.test.users[0].prop.name).to.equal('value2');
		expect(view.wrappers.sources.length).to.equal(6);
		expect(view.wrappers.targets.length).to.equal(6);
		expect(view.wrappers.sources[0]).to.equal(view.data.test);
		expect(view.wrappers.sources[1]).to.equal(view.data.test.users);
		expect(view.wrappers.sources[2]).to.equal(view.data.test.users[0]);
		expect(view.wrappers.sources[3]).to.equal(view.data.test.users[0].prop);
		expect(view.wrappers.sources[4]).to.equal(view.data.test.users[1]);
		expect(view.wrappers.sources[5]).to.equal(view.data.test.users[1].prop);
	});

	it('remove model', function () {
		var view = new TemplateView({
			data: {
				test: {
					prop: {
						user: {
							name: 'value'
						}
					}
				}
			}
		});

		view.model('test').model('prop').model('user');

		expect(view.wrappers.sources.length).to.equal(3);
		expect(view.wrappers.targets.length).to.equal(3);
		expect(view.wrappers.sources[0]).to.equal(view.data.test);
		expect(view.wrappers.sources[1]).to.equal(view.data.test.prop);
		expect(view.wrappers.sources[2]).to.equal(view.data.test.prop.user);

		view.model('test').set('prop', {user: 'value'});

		expect(view.wrappers.sources.length).to.equal(1);
		expect(view.wrappers.targets.length).to.equal(1);
		expect(view.wrappers.sources[0]).to.equal(view.data.test);
		expect(view.data).to.eql({test: {prop: {user: 'value'}}});
		expect(view.model('test').model('prop').get('user')).to.equal('value');
		expect(view.wrappers.sources.length).to.equal(2);
		expect(view.wrappers.targets.length).to.equal(2);
		expect(view.wrappers.sources[0]).to.eql(view.data.test);
		expect(view.wrappers.sources[1]).to.eql(view.data.test.prop);

		view.set('test', {});
		expect(view.wrappers.sources.length).to.equal(0);
		expect(view.wrappers.targets.length).to.equal(0);
	});
});