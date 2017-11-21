var assert    = require('assert');
var config    = require("../config/specs");
var uuid      = require('uuid/v1');
var geoServer = require("../geojson-server");
var wd        = require("../wd-helper");
var fs        = require("fs");
var path      = require("path");
var mkdirp    = require("mkdirp");
var artifacts = require("../artifacts");

var COVERAGE_PATH = artifacts.pathSync("/coverage");


/**
 * Sometimes chrome driver can result in the wrong text.
 *
 * See <https://github.com/webdriverio/webdriverio/issues/1886>
 */
browser.addCommand('setValueSafe', function(selector, text) {
  for(var i=0; i<10; i++) {
    browser.waitForVisible(selector);
    browser.setValue(selector, text);
    var browserText = browser.getValue(selector);

    if(browserText == text) {
      return;
    }
    else {
      console.error("Warning: setValue failed, trying again...");
    }
  }
})

browser.addCommand('flushReactUpdates', function() {
  browser.executeAsync(function(done) {
    // For any events to propogate
    setImmediate(function() {
      // For the DOM to be updated.
      setImmediate(done);
    })
  })
})


describe('maputnik', function() {
  var geoserver;

  before(function(done) {
    // Start style server
    geoserver = geoServer.listen(9002, done);
  });

  function getStyleStore(browser) {
    var result = browser.executeAsync(function(done) {
      window.debug.get("maputnik", "styleStore").latestStyle(done);
    })
    return result.value;
  }

  function getStyleUrl(styles) {
    var port = geoserver.address().port;
    return "http://localhost:"+port+"/styles/empty/"+styles.join(",");
  }

  beforeEach(function() {
    browser.url(config.baseUrl+"?debug&style="+getStyleUrl([
      "example"
    ]));
    browser.waitForExist(".maputnik-toolbar-link");
    browser.flushReactUpdates();
  });

  it('check logo exists', function () {
    var src = browser.getAttribute(".maputnik-toolbar-link img", "src");
    assert.equal(src, config.baseUrl+'/img/logo-color.svg');
  });

  describe("layers", function() {
    beforeEach(function() {
      browser.click(wd.$('layer-list:add-layer'))

      // Wait for events
      browser.flushReactUpdates();

      browser.waitForExist(wd.$('modal:add-layer'));
      browser.isVisible(wd.$('modal:add-layer'));
      browser.isVisibleWithinViewport(wd.$('modal:add-layer'));

      // Wait for events
      browser.flushReactUpdates();
    });

    it('background', function () {
      var id = uuid();

      browser.selectByValue(wd.$("add-layer.layer-type", "select"), "background");
      browser.flushReactUpdates();
      browser.setValueSafe(wd.$("add-layer.layer-id", "input"), "background:"+id);

      // Wait for change events to fire and state updated
      browser.flushReactUpdates();
      browser.click(wd.$("add-layer"));

      var styleObj = getStyleStore(browser);
      assert.deepEqual(styleObj.layers, [
        {
          "id": 'background:'+id,
          "type": 'background'
        }
      ]);
    });

    it('fill', function () {
      var id = uuid();

      browser.selectByValue(wd.$("add-layer.layer-type", "select"), "fill");
      browser.flushReactUpdates();
      browser.setValueSafe(wd.$("add-layer.layer-id", "input"), "fill:"+id);
      browser.setValueSafe(wd.$("add-layer.layer-source-block", "input"), "example");

      // Wait for change events to fire and state updated
      browser.flushReactUpdates();
      browser.click(wd.$("add-layer"));

      var styleObj = getStyleStore(browser);
      assert.deepEqual(styleObj.layers, [
        {
          "id": 'fill:'+id,
          "type": 'fill',
          "source": "example"
        }
      ]);
    });

  });

  after(function() {
    // Code coverage
    var results = browser.execute(function() {
      return window.__coverage__;
    });

    var jsonStr = JSON.stringify(results.value, null, 2);
    fs.writeFileSync(COVERAGE_PATH+"/coverage.json", jsonStr);
  })


});
