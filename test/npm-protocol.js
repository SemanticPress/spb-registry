var debug = require('debug')('reggie');
var expect = require('chai').expect;

var helpers = require('./helpers.js');

describe('reggie npm server', function() {
  before(helpers.prepareSandbox);
  before(helpers.startReggieServer);
  after(helpers.stopReggieServer);

  it('publishes a package that does not exist yet', function(done) {
    var npmConfig = {
      // verify that we can publish without AuthSession cookie
      // (yes, this test verifies two things)
      _token: undefined
    };

    var pkg = helpers.givenAPackage();

    helpers.runNpmInDirectory(
      pkg.folder,
      ['publish'],
      expectPackageWasPublished(done, pkg.nameAtVersion)
    );
  });

  it('renews AuthSession when the session is expired', function(done) {
    // This test verifies that 'GET /_session' renews AuthSession cookie.
    // We are testing it in context of `npm publish` because that's
    // what matters.

    var npmConfig = {
      _token: helpers.anExpiredAuthToken()
    };

    var pkg = helpers.givenAPackage();

    helpers.runNpmInDirectory(
      pkg.folder,
      ['publish'],
      npmConfig,
      expectPackageWasPublished(done, pkg.nameAtVersion)
    );
  });

  it('searches for a package that does not exist', function(done) {
    // This test verifies that searching for a package which does not
    // exist returns no results.
    var pkg = helpers.givenAPackage();

    helpers.runNpmInDirectory(
      pkg.folder,
      ['search', pkg.nameAtVersion],
      expectPackageNotFoundInSearch(done, pkg.nameAtVersion)
    );
  });

  it('searches for a package that is already published', function(done) {
    // This test verifies that searching for a package which is
    // published return the correct search result.
    var pkg = helpers.givenAPackage();

    helpers.runNpmInDirectory(
      pkg.folder,
      ['publish'],
      function(err, stdout, stderr) {
        if (err) done(err);
        helpers.runNpmInDirectory(
          pkg.folder,
          ['search', pkg.name],
          expectPackageFoundInSearch(done, pkg.name)
        );
      }
    );
  });
});

function expectPackageWasPublished(done, nameAtVersion) {
  return function(err, stdout, stderr) {
    if (err) done(err);
    debug(stderr.toString());
    expect(stdout.toString().trim()).to.equal('+ ' + nameAtVersion);
    done();
  };
}

function expectPackageNotFoundInSearch(done, nameAtVersion) {
  return function(err, stdout, stderr) {
    if (err) done(err);
    expect(stdout.toString().trim()).to.have.string('No match found for "' + nameAtVersion + '"');
    done();
  };
}

function expectPackageFoundInSearch(done, nameAtVersion) {
  return function(err, stdout, stderr) {
    if (err) done(err);
    expect(stdout.toString().trim()).to.not.have.string('No match found for "' + nameAtVersion + '"');
    done();
  };
}