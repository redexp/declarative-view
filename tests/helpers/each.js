require('../setup');

describe('each helper', function () {
	it('should be empty', function () {
		var view = new DeclarativeView({
			node: '<ul><li></li></ul>',
			data: {
				test: []
			},
			template: {
				'@root': {
					each: {
						prop: 'test'
					}
				}
			}
		});

		expect(view.node.children().length).to.equal(0);
	});

	it('should not be empty', function () {
		var view = new DeclarativeView({
			node: '<ul><li></li></ul>',
			data: {
				test: {
					values: [1, 'a', true]
				}
			},
			template: {
				'@root': {
					each: {
						prop: ['test', 'values']
					}
				}
			}
		});

		expect(view.node.children().length).to.equal(3);
	});

	it('should handle item as simple value', function () {
		var view = new DeclarativeView({
			node: '<ul><li></li></ul>',
			data: {
				test: [1, 'a', true]
			},
			template: {
				'@root': {
					each: {
						prop: 'test',
						template: {
							'@root': {
								text: '=value'
							}
						}
					}
				}
			}
		});

		expect(view.node.children().eq(0)).to.have.text('1');
		expect(view.node.children().eq(1)).to.have.text('a');
		expect(view.node.children().eq(2)).to.have.text('true');
	});

	it('should handle item as object', function () {
		var view = new DeclarativeView({
			node: '<ul><li></li></ul>',
			data: {
				test: [{name: 'value1'}, {name: 'value2'}, {name: 'value3'}]
			},
			template: {
				'@root': {
					each: {
						prop: 'test',
						template: {
							'@root': {
								text: '=name'
							}
						}
					}
				}
			}
		});

		expect(view.node.children().eq(0)).to.have.text('value1');
		expect(view.node.children().eq(1)).to.have.text('value2');
		expect(view.node.children().eq(2)).to.have.text('value3');
	});

	it('node option as selector', function () {
		var view = new DeclarativeView({
			node: '<ul><li class="first"></li><li class="test"></li><li class="last"></li></ul>',
			data: {
				test: [1, 2]
			},
			template: {
				'@root': {
					each: {
						prop: 'test',
						node: '> .test'
					}
				}
			}
		});

		expect(view.node.children().length).to.equal(4);
		expect(view.node.children().eq(0)).to.have.class('first');
		expect(view.node.children().eq(1)).to.have.class('last');
		expect(view.node.children().eq(2)).to.have.class('test');
		expect(view.node.children().eq(3)).to.have.class('test');
	});

	it('node option as html', function () {
		var view = new DeclarativeView({
			node: '<ul><li class="first"></li></ul>',
			data: {
				test: [1, 2]
			},
			template: {
				'@root': {
					each: {
						prop: 'test',
						node: '<li class="test"></li>'
					}
				}
			}
		});

		expect(view.node.children().length).to.equal(3);
		expect(view.node.children().eq(0)).to.have.class('first');
		expect(view.node.children().eq(1)).to.have.class('test');
		expect(view.node.children().eq(2)).to.have.class('test');
	});

	it('node option as false', function () {
		var view = new DeclarativeView({
			node: '<ul><li class="first"></li></ul>',
			data: {
				test: [1, 2]
			},
			template: {
				'@root': {
					each: {
						prop: 'test',
						view: function () {
							return new DeclarativeView({
								node: '<li class="test">'
							});
						},
						node: false
					}
				}
			}
		});

		expect(view.node.children().length).to.equal(3);
		expect(view.node.children().eq(0)).to.have.class('first');
		expect(view.node.children().eq(1)).to.have.class('test');
		expect(view.node.children().eq(2)).to.have.class('test');
	});

	it('view option as class', function () {
		var Test = DeclarativeView.extend({
			template: {
				'@root': {
					text: '=value'
				}
			}
		});

		var view = new DeclarativeView({
			node: '<ul><li></li></ul>',
			data: {
				test: [1, 2]
			},
			template: {
				'@root': {
					each: {
						prop: 'test',
						view: Test
					}
				}
			}
		});

		expect(view.node.children().length).to.equal(2);
		expect(view.node.children().eq(0)).to.have.text('1');
		expect(view.node.children().eq(1)).to.have.text('2');
	});

	it('view option as function which returns class', function () {
		var Test = DeclarativeView.extend({
			template: {
				'@root': {
					text: '=value'
				}
			}
		});

		var cb = sinon.spy(function () {
			return Test;
		});

		var view = new DeclarativeView({
			node: '<ul><li></li></ul>',
			data: {
				test: [1, 2]
			},
			template: {
				'@root': {
					each: {
						prop: 'test',
						view: cb,
						template: {
							'@root': {
								'prop': {
									'test': '=value'
								}
							}
						}
					}
				}
			}
		});

		expect(view.node.children().length).to.equal(2);
		expect(view.node.children().eq(0)).to.have.text('1').and.prop('test', 1);
		expect(view.node.children().eq(1)).to.have.text('2').and.prop('test', 2);

		expect(cb).to.have.callCount(2);
		expect(cb).to.be.calledOn(view);
		expect(cb.getCall(0).args[0]).to.equal(1);
		expect(cb.getCall(0).args[1]).to.be.instanceOf(DeclarativeView.$);
		expect(cb.getCall(1).args[0]).to.equal(2);
		expect(cb.getCall(1).args[1]).to.be.instanceOf(DeclarativeView.$);
	});

	it('view option as function which returns view', function () {
		var cb = sinon.spy(function (item, node) {
			return new DeclarativeView({
				node: node,
				data: {
					name: item
				},
				template: {
					'@root': {
						text: '=name'
					}
				}
			});
		});

		var view = new DeclarativeView({
			node: '<ul><li></li></ul>',
			data: {
				test: [1, 2]
			},
			template: {
				'@root': {
					each: {
						prop: 'test',
						view: cb
					}
				}
			}
		});

		expect(view.node.children().length).to.equal(2);
		expect(view.node.children().eq(0)).to.have.text('1');
		expect(view.node.children().eq(1)).to.have.text('2');

		expect(cb).to.have.callCount(2);
		expect(cb).to.be.calledOn(view);
		expect(cb.getCall(0).args[0]).to.equal(1);
		expect(cb.getCall(0).args[1]).to.be.instanceOf(DeclarativeView.$);
		expect(cb.getCall(1).args[0]).to.equal(2);
		expect(cb.getCall(1).args[1]).to.be.instanceOf(DeclarativeView.$);
	});

	it('should listen add and remove events', function () {
		var view = new DeclarativeView({
			node: '<ul><li></li></ul>',

			data: {
				users: []
			},

			template: {
				'@root': {
					each: {
						prop: 'users',
						template: {
							'@root': {
								text: '=name'
							}
						}
					}
				}
			}
		});

		view.model('users').add({name: 'value1'});
		expect(view.node.children().length).to.equal(1);
		expect(view.node.children().eq(0)).to.have.text('value1');
		view.model('users').add([{name: 'value2'}, {name: 'value3'}]);
		expect(view.node.children().length).to.equal(3);
		expect(view.node.children().eq(0)).to.have.text('value1');
		expect(view.node.children().eq(1)).to.have.text('value2');
		expect(view.node.children().eq(2)).to.have.text('value3');
		view.model('users').add({name: 'value4'}, 1);
		expect(view.node.children().length).to.equal(4);
		expect(view.node.children().eq(0)).to.have.text('value1');
		expect(view.node.children().eq(1)).to.have.text('value4');
		expect(view.node.children().eq(2)).to.have.text('value2');
		expect(view.node.children().eq(3)).to.have.text('value3');
		view.model('users').add([{name: 'value5'}, {name: 'value6'}], 0);
		expect(view.node.children().length).to.equal(6);
		expect(view.node.children().eq(0)).to.have.text('value5');
		expect(view.node.children().eq(1)).to.have.text('value6');
		expect(view.node.children().eq(2)).to.have.text('value1');
		expect(view.node.children().eq(3)).to.have.text('value4');
		expect(view.node.children().eq(4)).to.have.text('value2');
		expect(view.node.children().eq(5)).to.have.text('value3');
		view.model('users').remove(view.data.users[1]);
		expect(view.node.children().length).to.equal(5);
		expect(view.node.children().eq(0)).to.have.text('value5');
		expect(view.node.children().eq(1)).to.have.text('value1');
		expect(view.node.children().eq(2)).to.have.text('value4');
		expect(view.node.children().eq(3)).to.have.text('value2');
		expect(view.node.children().eq(4)).to.have.text('value3');
		view.model('users').remove([view.data.users[1], view.data.users[3]]);
		expect(view.node.children().length).to.equal(3);
		expect(view.node.children().eq(0)).to.have.text('value5');
		expect(view.node.children().eq(1)).to.have.text('value4');
		expect(view.node.children().eq(2)).to.have.text('value3');
		view.model('users').removeAt(0);
		expect(view.node.children().length).to.equal(2);
		expect(view.node.children().eq(0)).to.have.text('value4');
		expect(view.node.children().eq(1)).to.have.text('value3');
		view.model('users').removeAt([1]);
		expect(view.node.children().length).to.equal(1);
		expect(view.node.children().eq(0)).to.have.text('value4');
		view.model('users').removeAll();
		expect(view.node.children().length).to.equal(0);
	});

	it('should listen move event', function () {
		var view = new DeclarativeView({
			node: '<ul><li class="first"></li><li class="test"></li></ul>',

			data: {
				users: []
			},

			template: {
				'@root': {
					each: {
						prop: 'users',
						node: '> .test',
						template: {
							'@root': {
								text: '=value'
							}
						}
					}
				}
			}
		});

		var users = view.model('users');
		var node = view.node;
		users.add(['user1', 'user2', 'user3']);
		users.move('user1', 1);
		expect(view.get('users')).to.eql(['user2', 'user1', 'user3']);
		expect(node.children().eq(1)).to.have.text('user2');
		expect(node.children().eq(2)).to.have.text('user1');
		expect(node.children().eq(3)).to.have.text('user3');
		users.moveFrom(2, 0);
		expect(view.get('users')).to.eql(['user3', 'user2', 'user1']);
		expect(node.children().eq(1)).to.have.text('user3');
		expect(node.children().eq(2)).to.have.text('user2');
		expect(node.children().eq(3)).to.have.text('user1');

		expect(node.children().eq(0)).to.have.class('first').and.text('');
		expect(node.children().length).to.equal(4);
	});

	it('should listen sort event', function () {
		var view = new DeclarativeView({
			node: '<ul><li class="first"></li><li class="test"></li></ul>',

			data: {
				users: []
			},

			template: {
				'@root': {
					each: {
						prop: 'users',
						node: '> .test',
						template: {
							'@root': {
								text: '=value'
							}
						}
					}
				}
			}
		});

		var users = view.model('users');
		var node = view.node;
		users.add(['user1', 'user2', 'user3']);
		users.sort(function (a, b) {
			return b.slice(-1) - a.slice(-1);
		});
		expect(view.get('users')).to.eql(['user3', 'user2', 'user1']);
		expect(node.children().eq(1)).to.have.text('user3');
		expect(node.children().eq(2)).to.have.text('user2');
		expect(node.children().eq(3)).to.have.text('user1');
		users.sort(function (a, b) {
			return a.slice(-1) - b.slice(-1);
		});
		expect(view.get('users')).to.eql(['user1', 'user2', 'user3']);
		expect(node.children().eq(1)).to.have.text('user1');
		expect(node.children().eq(2)).to.have.text('user2');
		expect(node.children().eq(3)).to.have.text('user3');

		expect(node.children().eq(0)).to.have.class('first').and.text('');
		expect(node.children().length).to.equal(4);
	});

	it('add, remove, move options', function () {
		var add = sinon.spy();
		var remove = sinon.spy();
		var move = sinon.spy();

		var view = new DeclarativeView({
			node: '<ul><li></li></ul>',

			data: {
				users: ['user1', 'user2', 'user3']
			},

			template: {
				'@root': {
					each: {
						prop: 'users',
						template: {
							'@root': {
								text: '=value'
							}
						},
						add: add,
						remove: remove,
						move: move
					}
				}
			}
		});

		var list = view.model('users');
		var views = list.views['@root'];

		expect(view.node.children().length).to.equal(0);
		expect(add).to.have.callCount(3);
		expect(add).to.be.calledWith(view.node, views.get(2), 2);
		list.add('user4');
		expect(add).to.have.callCount(4);
		expect(add).to.be.calledWith(view.node, views.get(3), 3);
		var itemView = views.get(2);
		list.remove('user3');
		expect(remove).to.have.callCount(1);
		expect(remove).to.be.calledWith(view.node, itemView, 2);
		list.move('user2', 0);
		expect(move).to.have.callCount(1);
		expect(move).to.be.calledWith(view.node, views.get(0), 0, 1);
		list.sort();
		expect(move).to.have.callCount(2);
		expect(move).to.be.calledWith(view.node, views.get(0), 0, 1);

		expect(add).to.be.always.calledOn(view);
		expect(remove).to.be.always.calledOn(view);
		expect(move).to.be.always.calledOn(view);
	});

	it('sort options', function () {
		var add = sinon.spy();
		var remove = sinon.spy();
		var move = sinon.spy();
		var sort = sinon.spy();

		var view = new DeclarativeView({
			node: '<ul><li></li></ul>',

			data: {
				users: ['user1', 'user2', 'user3']
			},

			template: {
				'@root': {
					each: {
						prop: 'users',
						template: {
							'@root': {
								text: '=value'
							}
						},
						add: add,
						remove: remove,
						move: move,
						sort: sort
					}
				}
			}
		});

		var list = view.model('users');
		var views = list.views['@root'];

		list.move('user2', 0);
		expect(move).to.have.callCount(1);
		expect(move).to.be.calledWith(view.node, views.get(0), 0, 1);
		list.sort();
		expect(move).to.have.callCount(1);
		expect(sort).to.have.callCount(1);
		expect(sort).to.be.calledWith(view.node, views);

		expect(move).to.be.always.calledOn(view);
		expect(sort).to.be.always.calledOn(view);
	});

	it('dataProp option', function () {
		var view = new DeclarativeView({
			node: '<ul><li></li></ul>',
			data: {
				users: [
					{name: 'test1'},
					{name: 'test2'}
				]
			},
			template: {
				'@root': {
					each: {
						prop: 'users',
						dataProp: 'user',
						template: {
							'@root': {
								text: '=user.name'
							}
						}
					}
				}
			}
		});

		expect(view.model('users').views['@root'].get(0).get('user')).to.equal(view.get('users')[0]);
		expect(view.views['@root'].get(0).get('user')).to.equal(view.get('users')[0]);
		expect(view.find('> li').first()).to.have.text('test1');
	});
	
	it('should add views prop to list', function () {
		var view = new DeclarativeView({
			node: '<div><ul><li></li></ul><ol><li></li></ol></div>',
			
			data: {
				users: [{name: 'value1'}, {name: 'value2'}]
			},
			
			template: {
				'ul': {
					each: {
						prop: 'users'
					}
				},
				'ol': {
					each: {
						prop: 'users'
					}
				}
			}
		});
		
		var users = view.model('users');
		
		expect(users.views).to.equal(users.views['ul']);
		expect(users.views).to.equal(view.views['ul']);
		expect(users.views.get(0).context).to.equal(view.data.users[0]);
		expect(users.views.get(1).context).to.equal(view.data.users[1]);
		expect(users.views.length()).to.equal(view.data.users.length);
		expect(users.views.indexByContext(users.get(0))).to.equal(0);
		expect(users.views.viewOf(users.get(0))).to.equal(users.views.get(0));
		expect(users.views['ol']).to.equal(view.views['ol']);
		expect(users.views['ol'].length()).to.equal(view.data.users.length);
	});

	it('should handle dot in prop path', function () {
		var view = new DeclarativeView({
			node: '<ul><li></li></ul>',
			data: {
				test: {
					users: [
						{name: 'value1'},
						{name: 'value2'}
					]
				}
			},
			template: {
				'@root': {
					each: {
						prop: 'test.users',
						template: {
							'@root': {
								text: '=name'
							}
						}
					}
				}
			}
		});

		expect(view.node.children().length).to.equal(2);
		expect(view.node.children().eq(0)).to.have.text('value1');
		expect(view.node.children().eq(1)).to.have.text('value2');
	});

	it('should add dataIndexProp', function () {
		var view = new DeclarativeView({
			node: '<ul><li></li></ul>',

			data: {
				users: [1, 2]
			},

			template: {
				'@root': {
					each: {
						prop: 'users',
						dataIndexProp: 'position'
					}
				}
			}
		});

		expect(view.views['@root'].get(0).data).to.eql({value: 1, position: 0});
		expect(view.views['@root'].get(1).data).to.eql({value: 2, position: 1});
	});
});