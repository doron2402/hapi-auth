var Hapi = require('hapi');
var Joi = require('joi');
var Async = require('async');
var Lodash = require('lodash');
var HapiAuthCookie = require('hapi-auth-cookie');


var users = {
    john: {
        id: 'john',
        password: 'password',
        name: 'John Doe'
    }
};

var home = function (request, reply) {

    reply('<html><head><title>Login page</title></head><body><h3>Welcome '
      + request.auth.credentials.name
      + '!</h3><br/><form method="get" action="/logout">'
      + '<input type="submit" value="Logout">'
      + '</form></body></html>');
};

var login = function (request, reply) {

    if (request.auth.isAuthenticated) {
        return reply.redirect('/');
    }

    var message = '';
    var account = null;

    if (request.method === 'post') {

        if (!request.payload.username ||
            !request.payload.password) {

            message = 'Missing username or password';
        }
        else {
            account = users[request.payload.username];
            if (!account ||
                account.password !== request.payload.password) {

                message = 'Invalid username or password';
            }
        }
    }

    if (request.method === 'get' ||
        message) {

        return reply('<html><head><title>Login page</title></head><body>'
            + (message ? '<h3>' + message + '</h3><br/>' : '')
            + '<form method="post" action="/login">'
            + 'Username: <input type="text" name="username"><br>'
            + 'Password: <input type="password" name="password"><br/>'
            + '<input type="submit" value="Login"></form></body></html>');
    }

    request.auth.session.set(account);
    return reply.redirect('/');
};

var logout = function (request, reply) {

    request.auth.session.clear();
    return reply.redirect('/');
};


var isAuthenticate = function(request, reply, next) {
    if (request.auth.isAuthenticated) {
        next(null, true);
    }
    next(null, false);
};

var userAuthLevel = function(request, reply, next) {
    next(null, 2);
};

var userProfile = function(request, reply) {
    isAuthenticate(request, reply, function(err, res) {
        if (err || !res) {
            return reply({code: 'err', err: { body: 'Not Authrized'} });
        }
        userAuthLevel(request, reply, function(err, res) {
            reply({code: 'ok', user: {level: res}});
        });
    });
};

var Routes = [{
    method: 'GET',
    path: '/',
    config: {
        handler: home,
        auth: 'session'
    }
},
{
    method: ['GET', 'POST'],
    path: '/login',
    config: {
        handler: login,
        auth: {
            mode: 'try',
            strategy: 'session'
        },
        plugins: {
            'hapi-auth-cookie': {
                redirectTo: false
            }
        }
    }
},
{
    method: 'GET',
    path: '/logout',
    config: {
        handler: logout,
        auth: 'session'
    }
},
{
    method: 'GET',
    path: '/users/{id}',
    config: {
        handler: userProfile,
        auth: 'session'
    }
}
];


var server = new Hapi.Server('0.0.0.0',8000);
server.pack.register(HapiAuthCookie, function(err) {
  server.auth.strategy('session','cookie', {
      password: 'aa123ASDF@#efaASDF@#RASDFavn__(!@*HKNASD!asdfh78awb12ADS#$FNnvas7@#e',
      cookie: 'sid-example',
      redirectTo: '/login',
      isSecure: false
  });
  server.route(Routes);
  server.start(function(err) {
    if (err) {
        console.log(err);
    }
    console.log('Server Start : 8000');
  });
});


