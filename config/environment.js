/* jshint node: true */

var os     = require('os');
var ifaces = os.networkInterfaces();

var addresses = [];
for (var dev in ifaces) {
  ifaces[dev].forEach(function(details){
    if(details.family === 'IPv4' && details.address !== '127.0.0.1') {
      addresses.push(details.address);
    }
  });
}

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'wecudos',
    podModulePrefix: 'wecudos/pods',
    environment: environment,
    baseURL: '/',
    locationType: 'hash',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    cordova: {
      rebuildOnChange: false,
      emulate: false,
      emberUrl: 'http://' + addresses[0] + ':4200',
      liveReload: {
        enabled: false,
        platform: 'ios'
      }
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    ENV.APP.LOG_VIEW_LOOKUPS = true;

    ENV.apiUrl   = 'http://' + addresses[0] + ':3000/api/v1';
    ENV.development = true;


    ENV.openTok = {
      apiKey: "45093672"
    };

    ENV.contentSecurityPolicy = {
      'default-src': "'none'",
      'script-src': "'self' 'unsafe-inline' 'unsafe-eval' http://static.opentok.com",
      'font-src': "'self'",
      'connect-src': "'self' https://hlg.tokbox.com https://anvil.opentok.com wss://*.tokbox.com",
      'img-src': "'self' http://static.opentok.com",
      'style-src': "'self' 'unsafe-inline' 'unsafe-eval' http://static.opentok.com",
      'media-src': "'self'"
    };
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.baseURL = '/';
    ENV.locationType = 'auto';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'staging') {
    ENV.apiUrl = 'http://wecudos-staging.herokuapp.com/api/v1';
    ENV.staging = true;
  }


  if (environment === 'production') {
    ENV.apiUrl = 'http://wecudos.herokuapp.com/api/v1';
    ENV.production = true;
  }

  return ENV;
};
