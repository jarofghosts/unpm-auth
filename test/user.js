var backend = require('unpm-mem-backend')
var User = require('../lib/user')
var crypto = require('crypto')
var test = require('tape')

function setupUser() {
  var unpm = {}

  unpm.backend = backend()
  unpm.config = {}
  unpm.config.crypto = {
    algorithm: 'sha512',
    saltLength: 30,
    iterations: 10
  }

  return User(unpm)
}

test('create user', function(t) {
  var User = setupUser()
  var userData = {}

  userData.password_sha = 'hunter2'
  userData.date = '2014-01-01'

  t.plan(3)

  User.create('ZeroCool', userData, function(err) {
    t.ok(!err, 'no error')
  })

  User.create(null, userData, function(err) {
    t.ok(err, 'requires username')
  })

  User.create('ZeroCool', {date: 'foo'}, function(err) {
    t.ok(err, 'requires password')
  })
})

test('find user', function(t) {
  var User = setupUser()

  var data = {
    name: 'ZeroCool',
    email: 'me@example.com',
    salt: 'saltine',
    date: '2014-01-01',
    password_sha: sha('hunter2saltine')
  }

  t.plan(9)

  User.create(data.name, data, function(err) {
    t.ok(!err, 'create user to find')

    User.find(data.name, function(err, user) {
      t.ok(!err, 'no error')
      t.equal(user.name, data.name, 'gets name')
      t.equal(user.email, data.email, 'gets email')
      t.equal(user.date, data.date, 'gets date')
      t.ok('_rev', 'gets _rev')
      t.equal(Object.keys(user).length, 3, 'nothing else')
    })

    User.find('other guy', function(err, user) {
      t.ok(!err, 'no error when not found')
      t.ok(!user, 'no user for other guy')
    })
  })
})

test('update user', function(t) {
  var User = setupUser()

  var data = {
    name: 'ZeroCool',
    email: 'me@example.com',
    salt: 'saltine',
    date: '2014-01-01',
    password_sha: sha('hunter2saltine')
  }

  t.plan(12)

  User.create(data.name, data, created)

  function created(err) {
    t.ok(!err, 'create user to find')

    data.email = 'me2@example.com'
    data.salt = 'saltine2'
    data.date = '2015-01-01'
    data.password_sha = sha('hunter2saltine2')

    User.find(data.name, function(err, user) {
      t.ok(!err, 'no err')
      User.update(user, data, updated)
    })
  }

  function updated(err, user) {
    t.ok(!err, 'no error')
    t.equal(user.email, data.email, 'gets email')
    t.equal(user.date, data.date, 'gets date')
    t.ok('_rev', 'gets _rev')
    t.equal(Object.keys(user).length, 3, 'nothing else')

    User.find(data.name, found)
  }

  function found(err, user) {
    t.ok(!err, 'no error')
    t.equal(user.email, data.email, 'gets email')
    t.equal(user.date, data.date, 'gets date')
    t.ok('_rev', 'gets _rev')
    t.equal(Object.keys(user).length, 3, 'nothing else')
  }
})

test('auth user', function(t) {
  var User = setupUser()

  var data = {
    email: 'me@example.com',
    salt: 'saltine',
    date: '2014-01-01'
  }

  data.password_sha = sha('hunter2saltine')

  t.plan(12)

  User.create('ZeroCool', data, created)

  function created(err, user) {
    t.ok(!err, 'no err')
    User.auth('ZeroCool', 'hunter2', authed)
  }

  function authed(err, user) {
    t.ok(!err, 'no error')
    t.ok(user, 'returns user')
    t.equal(user.name, 'ZeroCool', 'gets name')
    t.equal(user.email, data.email, 'gets email')
    t.equal(user.date, data.date, 'gets date')
    t.ok('_rev', 'gets _rev')
    t.equal(Object.keys(user).length, 3, 'nothing else')

    User.auth('ZeroCool', 'hunter3', not_found)
    User.auth('ZeroCoo1', 'hunter2', not_found)
  }

  function not_found(err, user) {
    t.ok(!user, 'no user')
    t.ok(err, 'returns error')
  }
})

function sha(s) {
  return crypto.createHash('sha1').update(s).digest('hex')
}
