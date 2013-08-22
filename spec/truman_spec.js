// Generated by CoffeeScript 1.6.1
(function() {

  describe('Truman', function() {
    beforeEach(function() {
      Truman.delay = 0;
      return Truman.dropTable('examples');
    });
    beforeEach(function() {
      return this.addMatchers({
        toHaveBeenCalledWithJson: function(data) {
          var actualData;
          actualData = JSON.parse(this.actual.mostRecentCall.args[0]);
          expect(actualData).toEqual(data);
          return true;
        }
      });
    });
    it('supports setting request headers', function() {
      var activity;
      activity = function() {
        var xhr;
        xhr = new XMLHttpRequest();
        xhr.open('GET', '/examples');
        return xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      };
      return expect(activity).not.toThrow();
    });
    describe('intercepts handlers', function() {
      var createGetRequest, handler, prepareAsyncTest;
      handler = null;
      beforeEach(function() {
        return handler = jasmine.createSpy();
      });
      prepareAsyncTest = function(makeAjaxRequest) {
        var expectation;
        runs(makeAjaxRequest);
        expectation = function() {
          return handler.callCount > 0;
        };
        waitsFor(expectation, 'handler never called', 100);
        return runs(function() {
          return expect(handler).toHaveBeenCalledWith('[]');
        });
      };
      createGetRequest = function() {
        var xhr;
        xhr = new XMLHttpRequest();
        xhr.open('GET', '/examples');
        return xhr;
      };
      it('added with the onload method', function() {
        return prepareAsyncTest(function() {
          var xhr;
          xhr = createGetRequest();
          xhr.onload = function() {
            if (xhr.readyState === 4) {
              return handler(xhr.responseText);
            }
          };
          return xhr.send();
        });
      });
      it('added with the onreadystatechange method', function() {
        return prepareAsyncTest(function() {
          var xhr;
          xhr = createGetRequest();
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              return handler(xhr.responseText);
            }
          };
          return xhr.send();
        });
      });
      it('added with the onprogress method', function() {
        return prepareAsyncTest(function() {
          var xhr;
          xhr = createGetRequest();
          xhr.onprogress = function() {
            if (xhr.readyState === 4) {
              return handler(xhr.responseText);
            }
          };
          return xhr.send();
        });
      });
      return it('added with addEventListener("load")', function() {
        return prepareAsyncTest(function() {
          var xhr;
          xhr = createGetRequest();
          xhr.addEventListener('load', function() {
            return handler(xhr.responseText);
          });
          return xhr.send();
        });
      });
    });
    return describe('creates fake records when sending POST requests to "create"-like routes', function() {
      var handler;
      handler = null;
      beforeEach(function() {
        return handler = jasmine.createSpy();
      });
      it('using form-encoded data', function() {
        runs(function() {
          var xhr;
          xhr = new XMLHttpRequest();
          xhr.open('POST', '/examples');
          xhr.addEventListener('load', function() {
            return handler(xhr.responseText);
          });
          return xhr.send('title=Example%20Title&content=Example%20Content');
        });
        waitsFor(function() {
          return handler.callCount > 0;
        });
        return runs(function() {
          return expect(handler).toHaveBeenCalledWithJson({
            id: 1,
            title: 'Example Title',
            content: 'Example Content'
          });
        });
      });
      return xit('using FormData', function() {
        runs(function() {
          var formData, xhr;
          xhr = new XMLHttpRequest();
          xhr.open('POST', '/examples');
          xhr.addEventListener('load', function() {
            return handler(xhr.responseText);
          });
          formData = new FormData();
          formData.append('title', 'Example Title');
          formData.append('content', 'Example Content');
          return xhr.send(formData);
        });
        waitsFor(function() {
          return handler.callCount > 0;
        });
        return runs(function() {
          return expect(handler).toHaveBeenCalledWithJson({
            id: 1,
            title: 'Example Title',
            content: 'Example Content'
          });
        });
      });
    });
  });

}).call(this);
