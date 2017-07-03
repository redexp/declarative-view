describe('model', function () {
	it('object model', function () {
		var view = new TemplateView({
			data: {
				test: {
					user: {
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

		expect(view.model('test').model('user').get('name')).to.equal('value');
		expect(view.model('users').model(0).get('name')).to.equal('test');

		var user = view.model('test').model('user');
		var setName = sinon.spy();
		var set = sinon.spy();
		user.on('set/name', setName);
		user.on('set/*', set);
		user.set('name', 'value2');
		expect(view.data.test.user.name).to.equal('value2');
		expect(setName).to.have.callCount(1);
		expect(setName).to.be.calledOn(user);
		expect(setName).to.be.calledWith('value2', 'value');
		expect(set).to.have.callCount(1);
		expect(set).to.be.calledOn(user);
		expect(set).to.be.calledWith('name', 'value2', 'value');

		expect(view.wrappers.sources.length).to.equal(4);
		expect(view.wrappers.targets.length).to.equal(4);
		view.model('test').set('user', {test: 'value'});
		expect(view.wrappers.sources.length).to.equal(3);
		view.set('users', []);
		expect(view.wrappers.sources.length).to.equal(1);
		view.set('test', {});
		expect(view.wrappers.sources.length).to.equal(0);
		expect(view.wrappers.targets.length).to.equal(0);
		expect(view.data).to.eql({test: {}, users: []});
	});

	it('array model', function () {
		var view = new TemplateView({
			data: {
				test: {
					users: [
						{
							name: 'value1'
						}
					]
				}
			}
		});

		var users = view.model(['test', 'users']);
		var add = sinon.spy();
		var remove = sinon.spy();
		users.on('add', add);
		users.on('remove', remove);
		users.add({name: 'value2'});
		expect(add).to.have.callCount(1);
		expect(add).to.be.calledWith({name: 'value2'}, 1);
		users.add({name: 'value3'}, 0);
		expect(add).to.be.calledWith({name: 'value3'}, 0);
		users.add([{name: 'value4'}, {name: 'value5'}]);
		expect(add).to.be.calledWith({name: 'value5'}, 4);
		users.add([{name: 'value6'}, {name: 'value7'}], 1);
		expect(add).to.be.calledWith({name: 'value7'}, 2);
		expect(view.data.test.users).to.eql([{name: 'value3'}, {name: 'value6'}, {name: 'value7'}, {name: 'value1'}, {name: 'value2'}, {name: 'value4'}, {name: 'value5'}]);
		expect(add).to.have.callCount(6);
		expect(add).to.be.always.calledOn(users);

		users.remove(view.data.test.users[1]);
		expect(remove).to.have.callCount(1);
		expect(remove).to.be.calledWith({name: 'value6'}, 1);
		users.remove([view.data.test.users[1], view.data.test.users[2]]);
		expect(remove).to.be.calledWith({name: 'value1'}, 1);
		users.removeAt(0);
		expect(remove).to.be.calledWith({name: 'value3'}, 0);
		users.removeAt([1, 2]);
		expect(remove).to.be.calledWith({name: 'value4'}, 1);
		users.removeAll();
		expect(remove).to.be.calledWith({name: 'value2'}, 0);
		expect(remove).to.have.callCount(7);
		expect(remove).to.be.always.calledOn(users);
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

	it('should stop listen view', function () {
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

		var set = sinon.spy();
		view.on('@test.users.0.name', set);
		expect(set).to.have.callCount(1);
		view.set(['test', 'users', 0, 'name'], 'test');
		expect(set).to.have.callCount(2);
		view.model('test').clear();
		view.set(['test', 'users', 0, 'name'], 'test2');
		expect(set).to.have.callCount(2);
	});
});