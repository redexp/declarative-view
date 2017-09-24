require('./setup');

describe('model', function () {
	it('object model', function () {
		var view = new DeclarativeView({
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
		user.on('set', set);
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
		var view = new DeclarativeView({
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
		var view = new DeclarativeView({
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
		var view = new DeclarativeView({
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

	it('should handle object of props', function () {
		var view = new DeclarativeView({
			data: {
				test: {
					prop1: 'value1',
					prop2: 'value2'
				}
			}
		});

		var set = sinon.spy();
		view.model('test').on('set', set);
		view.model('test').set({
			prop1: 'test1',
			prop2: 'test2',
			prop3: 'test3'
		});
		expect(set).to.have.callCount(3);
		expect(set).to.be.always.calledOn(view.model('test'));
		expect(set.getCall(0)).to.be.calledWith('prop1', 'test1', 'value1');
		expect(set.getCall(1)).to.be.calledWith('prop2', 'test2', 'value2');
		expect(set.getCall(2)).to.be.calledWith('prop3', 'test3', undefined);
	});

	it('should handle indexes more than length and less zero', function () {
		var view = new DeclarativeView({
			data: {
				users: [
					{name: 'value1'}
				]
			}
		});

		var users = view.model('users');
		var add = sinon.spy();
		var remove = sinon.spy();
		var move = sinon.spy();
		users.on('add', add);
		users.on('remove', remove);
		users.on('move', move);

		users.add({name: 'value2'}, 10);
		expect(view.data.users).to.eql([{name: 'value1'}, {name: 'value2'}]);
		expect(add).to.be.calledWith({name: 'value2'}, 1);
		users.add([{name: 'value3'}, {name: 'value4'}], -1);
		expect(view.data.users).to.eql([{name: 'value1'}, {name: 'value3'}, {name: 'value4'}, {name: 'value2'}]);
		expect(add).to.be.calledWith({name: 'value4'}, 2);
		users.removeAt(10);
		expect(view.data.users).to.eql([{name: 'value1'}, {name: 'value3'}, {name: 'value4'}, {name: 'value2'}]);
		expect(remove).to.have.callCount(0);
		users.removeAt(-1);
		expect(view.data.users).to.eql([{name: 'value1'}, {name: 'value3'}, {name: 'value4'}]);
		expect(remove).to.be.calledWith({name: 'value2'}, 3);
		users.moveFrom(10, 0);
		expect(view.data.users).to.eql([{name: 'value1'}, {name: 'value3'}, {name: 'value4'}]);
		expect(move).to.have.callCount(0);
		users.moveFrom(-1, 0);
		expect(view.data.users).to.eql([{name: 'value4'}, {name: 'value1'}, {name: 'value3'}]);
		expect(move).to.be.calledWith({name: 'value4'}, 0, 2);
		users.moveFrom(-2, -1);
		expect(view.data.users).to.eql([{name: 'value4'}, {name: 'value3'}, {name: 'value1'}]);
		expect(move).to.be.calledWith({name: 'value1'}, 2, 1);
		users.moveFrom(0, 10);
		expect(view.data.users).to.eql([{name: 'value3'}, {name: 'value1'}, {name: 'value4'}]);
		expect(move).to.be.calledWith({name: 'value4'}, 2, 0);
	});

	it('should return model of object', function () {
		var view = new DeclarativeView({
			data: {
				test: {
					user: {
						name: 'value'
					}
				}
			}
		});

		var model = view.model('test').model('user');
		expect(view.modelOf(view.data.test.user)).to.equal(model);
		expect(view.modelOf({})).to.be.undefined;
	});

	it('should return model of object in array wrapper', function () {
		var view = new DeclarativeView({
			data: {
				test: {
					users: [
						{name: 'value1'},
						{name: 'value2'}
					]
				}
			}
		});

		var users = view.model('test').model('users');
		expect(users.modelOf(view.data.test.users[0])).to.equal(users.model(0));
		expect(users.modelOf({})).to.be.undefined;
	});

	it('should return model of object in array wrapper', function () {
		var users = [
			{name: 'value1'},
			{name: 'value2'}
		];

		var wrappers = [
			{test1: true},
			{test2: true}
		];

		var view = new DeclarativeView({
			data: {
				test: {
					users: users
				}
			},

			wrappers: {
				sources: users,
				targets: wrappers
			}
		});

		expect(view.model('test').model('users').model(0)).to.equal(wrappers[0]);
	});

	it('should listen to change of array', function () {
		var view = new DeclarativeView({
			data: {
				test: {
					users: []
				},
				list: []
			}
		});

		var change = sinon.spy();
		view.on('@test.users', change);
		expect(change).to.be.calledWith(view.data.test.users);
		view.model('test').model('users').add('test1');
		expect(change).to.be.calledWith(view.data.test.users, 'add', 'test1', 0);
		view.model('test').model('users').remove('test1');
		expect(change).to.be.calledWith(view.data.test.users, 'remove', 'test1', 0);
		view.model('test').model('users').add(['test1', 'test2', 'test3', 'test4']);
		view.model('test').model('users').move('test4', 1);
		expect(change).to.be.calledWith(view.data.test.users, 'move', 'test4', 1, 3);
		view.model('test').model('users').sort();
		expect(change).to.be.calledWith(view.data.test.users, 'sort');

		change = sinon.spy();
		view.on('@list', change);
		expect(change).to.be.calledWith(view.data.list);
		view.model('list').add('test1');
		expect(change).to.be.calledWith(view.data.list, 'add', 'test1', 0);
		view.model('list').remove('test1');
		expect(change).to.be.calledWith(view.data.list, 'remove', 'test1', 0);
		view.model('list').add(['test1', 'test2', 'test3', 'test4']);
		view.model('list').move('test4', 1);
		expect(change).to.be.calledWith(view.data.list, 'move', 'test4', 1, 3);
		view.model('list').sort();
		expect(change).to.be.calledWith(view.data.list, 'sort');
	});

	it('should deep assign props', function () {
		var view = new DeclarativeView({
			data: {
				user: {
					name: '',
					list: [1, 2, 3],
					test: {
						prop: 'value'
					}
				}
			}
		});

		var setUser = sinon.spy();
		var removeList = sinon.spy();
		var addList = sinon.spy();
		var setTest = sinon.spy();
		view.model('user').on('set', setUser);
		view.model('user').model('list').on('remove', removeList);
		view.model('user').model('list').on('add', addList);
		view.model('user').model('test').on('set', setTest);

		var data = {
			name: 'test',
			list: [4, 5, 6],
			test: {
				prop: 'value1',
				prop2: 'value2'
			}
		};
		view.model('user').assign(data);
		expect(view.data).to.eql({user: data});
		expect(setUser).to.have.callCount(1);
		expect(setUser).to.be.calledWith('name', 'test', '');
		expect(removeList).to.have.callCount(3);
		expect(removeList).to.be.calledWith(3, 2);
		expect(addList).to.have.callCount(3);
		expect(addList).to.be.calledWith(6, 2);
		expect(setTest).to.have.callCount(2);
		expect(setTest.getCall(0)).to.be.calledWith('prop', 'value1', 'value');
		expect(setTest.getCall(1)).to.be.calledWith('prop2', 'value2', undefined);

		data = {
			user: {
				name: 'test2',
				list: [],
				test: {
					prop: 'value2',
					prop2: 'value2'
				}
			}
		};
		view.assign(data);
		expect(view.data).to.eql(data);
		expect(setUser).to.have.callCount(2);
		expect(setUser).to.be.calledWith('name', 'test2', 'test');
		expect(removeList).to.have.callCount(6);
		expect(removeList).to.be.calledWith(4, 0);
		expect(setTest).to.have.callCount(3);
		expect(setTest).to.be.calledWith('prop', 'value2', 'value1');
	});

	it('assign mode', function () {
		var view = new DeclarativeView({
			data: {
				test: {
					user: {
						name: 'value'
					}
				}
			}
		});

		view.assign({test2: {}}, 'ignore');
		expect(view.data).to.eql({test: {user: {name: 'value'}}, test2: {}});
		view.assign({test2: {name: 'val'}, test3: {}}, 'defaults');
		expect(view.data).to.eql({test: {user: {name: 'value'}}, test2: {}});
		view.assign({test2: {name: 'val1'}});
		view.assign({test2: {name: 'val2', name2: 'val2'}}, 'defaults');
		expect(view.data).to.eql({test: {user: {name: 'value'}}, test2: {name: 'val2'}});
		view.model('test').assign({user: {name: 'value2'}, user2: {}}, 'ignore');
		expect(view.data).to.eql({test: {user: {name: 'value2'}, user2: {}}, test2: {name: 'val2'}});
		view.model('test').assign({user2: {name: 'val'}, user3: {}}, 'defaults');
		expect(view.data).to.eql({test: {user: {name: 'value2'}, user2: {}}, test2: {name: 'val2'}});
		view.model('test').assign({user2: {name: 'val'}});
		view.model('test').assign({user2: {name: 'val2', name2: 'val2'}}, 'defaults');
		expect(view.data).to.eql({test: {user: {name: 'value2'}, user2: {name: 'val2'}}, test2: {name: 'val2'}});
	});
});