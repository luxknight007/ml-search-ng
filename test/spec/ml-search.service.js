/* global describe, beforeEach, module, it, expect, inject */

describe('MLSearch', function () {
  'use strict';

  var factory, $httpBackend, $q, $location, $rootScope;

  //fixtures
  beforeEach(module('search-results.json'));
  beforeEach(module('search-results-paginated.json'));
  beforeEach(module('search-results-with-facets.json'));
  beforeEach(module('options-with-grammer.json'));
  beforeEach(module('options-constraint.json'));
  beforeEach(module('options-constraint-color.json'));

  beforeEach(module('ml.search'));

  beforeEach(inject(function ($injector) {
    $q = $injector.get('$q');
    $httpBackend = $injector.get('$httpBackend');
    $location = $injector.get('$location');
    $rootScope = $injector.get('$rootScope');

    factory = $injector.get('MLSearchFactory');
  }));

  describe('#getters-setters', function () {

    it('returns a search object', function() {
      var mlSearch = factory.newContext();
      expect(mlSearch.search()).toBeDefined;
    });

    it('has a query builder', function() {
      var mlSearch = factory.newContext();
      expect(mlSearch.qb).not.toBeNull;
    });

    it('gets active facets', function() {
      var mlSearch = factory.newContext(),
          actual;

      mlSearch.selectFacet('name', 'value');
      actual = mlSearch.getActiveFacets();

      expect(actual.name).toBeDefined;
      expect(actual.name.values.length).toEqual(1);
      expect(actual.name.values[0]).toEqual('value');
    });

    it('gets namespace prefix', function() {
      var mlSearch = factory.newContext();
      mlSearch.setNamespaces([{ prefix: 'ex', uri: 'http://example.com' }]);

      expect(mlSearch.getNamespacePrefix('http://example.com')).toEqual('ex');
    });

    it('gets namespace uri', function() {
      var mlSearch = factory.newContext();
      mlSearch.setNamespaces([{ prefix: 'ex', uri: 'http://example.com' }]);

      expect(mlSearch.getNamespaceUri('ex')).toEqual('http://example.com');
    });

    it('gets namespaces', function() {
      var mlSearch = factory.newContext();
      mlSearch.setNamespaces([{ prefix: 'ex', uri: 'http://example.com' }]);

      expect(mlSearch.getNamespaces().length).toEqual(1);
      expect(mlSearch.getNamespaces()[0].prefix).toEqual('ex');
      expect(mlSearch.getNamespaces()[0].uri).toEqual('http://example.com');
    });

    it('adds namespace', function() {
      var mlSearch = factory.newContext();
      mlSearch.addNamespace({ prefix: 'ex', uri: 'http://example.com' });

      expect(mlSearch.getNamespaces().length).toEqual(1);
      expect(mlSearch.getNamespaces()[0].prefix).toEqual('ex');
      expect(mlSearch.getNamespaces()[0].uri).toEqual('http://example.com');


      mlSearch.addNamespace({ prefix: 'ie', uri: 'http://example.com/ie' });

      expect(mlSearch.getNamespaces().length).toEqual(2);
      expect(mlSearch.getNamespaces()[1].prefix).toEqual('ie');
      expect(mlSearch.getNamespaces()[1].uri).toEqual('http://example.com/ie');
    });

    it('clears namespaces', function() {
      var mlSearch = factory.newContext();
      mlSearch.setNamespaces([{ prefix: 'ex', uri: 'http://example.com' }]);

      expect(mlSearch.getNamespaces().length).toEqual(1);
      expect(mlSearch.getNamespaces()[0].prefix).toEqual('ex');
      expect(mlSearch.getNamespaces()[0].uri).toEqual('http://example.com');

      mlSearch.clearNamespaces();
      expect(mlSearch.getNamespaces().length).toEqual(0);
    });

    it('gets and sets boostQueries', function() {
      var mlSearch = factory.newContext(),
          qb = mlSearch.qb,
          boost = qb.and();

      mlSearch.addBoostQuery(boost);

      expect(mlSearch.getBoostQueries().length).toEqual(1);
      expect(mlSearch.getBoostQueries()[0]).toEqual(boost);

      expect( mlSearch.getQuery().query.queries[0]['boost-query']['boosting-query'][0] )
        .toEqual(boost);

      mlSearch.clearBoostQueries();

      expect(mlSearch.getBoostQueries().length).toEqual(0);
    });

    it('gets and sets additionalQueries', function() {
      var mlSearch = factory.newContext(),
          qb = mlSearch.qb,
          additional = qb.and();

      mlSearch.addAdditionalQuery(additional);

      expect(mlSearch.getAdditionalQueries().length).toEqual(1);
      expect(mlSearch.getAdditionalQueries()[0]).toEqual(additional);

      expect( mlSearch.getQuery().query.queries[0]['and-query'].queries[1][0] )
        .toEqual(additional);

      mlSearch.clearAdditionalQueries();

      expect(mlSearch.getAdditionalQueries().length).toEqual(0);
    });

    it('gets and sets search transform', function() {
      var mlSearch = factory.newContext();

      expect(mlSearch.getTransform()).toBeNull();
      expect(mlSearch.setTransform('test')).toBe(mlSearch);
      expect(mlSearch.getTransform()).toEqual('test');
    });

    it('sets the query text', function() {
      var mlSearch = factory.newContext();

      expect(mlSearch.getQuery().query.queries[0]['and-query'].queries.length).toEqual(0);
      expect(mlSearch.setText('test')).toBe(mlSearch);
      expect(mlSearch.getQuery().query.queries[0]['and-query'].queries.length).toEqual(2);
      expect(mlSearch.getQuery().query.queries[0]['and-query'].queries[1].qtext).toEqual('test');
    });

    it('gets the query text', function() {
      var mlSearch = factory.newContext();
      expect(mlSearch.getText()).toBe(null);
      expect(mlSearch.setText('test')).toBe(mlSearch);
      expect(mlSearch.getText()).toEqual('test');
    });

    it('sets and gets page number and page length', function() {
      var mlSearch = factory.newContext();

      expect(mlSearch.getPageLength()).toEqual(10);
      expect(mlSearch.setPage(4)).toBe(mlSearch);
      expect(mlSearch.getPage()).toEqual(4);

      expect(mlSearch.setPageLength(20)).toBe(mlSearch);
      expect(mlSearch.getPageLength()).toEqual(20);
      expect(mlSearch.setPage(9).getPage()).toEqual(9);

      expect(mlSearch.setPageLength(18).getPageLength()).toEqual(18);
      expect(mlSearch.setPage(7).getPage()).toEqual(7);
      expect(mlSearch.setPage(1).getPage()).toEqual(1);
    });

    it('initializes and gets queryOptions', function() {
      var mlSearch = factory.newContext();

      expect(mlSearch.getQueryOptions()).toBe('all');

      mlSearch = factory.newContext({ queryOptions: 'some' });
      expect(mlSearch.getQueryOptions()).toBe('some');

      mlSearch = factory.newContext({ queryOptions: null });
      expect(mlSearch.getQueryOptions()).toBeNull();
    });

    it('gets, sets, and clears snippet', function() {
      // this test assumes that the results transform operator is called "results"; the service code
      // makes this assumption as well.

      var mlSearch = factory.newContext();

      expect(mlSearch.getSnippet()).toBe('compact');

      mlSearch = factory.newContext({ snippet: 'full' });

      expect(mlSearch.getSnippet()).toBe('full');
      expect(mlSearch.setSnippet('partial')).toBe(mlSearch);
      expect(mlSearch.getSnippet()).toBe('partial');

      expect(mlSearch.clearSnippet()).toBe(mlSearch);
      expect(mlSearch.getSnippet()).toBe('compact');

      //TODO: getQuery()
    });

    it('gets, sets, and clears sort', function() {
      // this test assumes that the sort operator is called "sort"; the service code
      // makes this assumption as well.

      var mlSearch = factory.newContext();

      expect(mlSearch.getSort()).toBe(null);
      expect(mlSearch.setSort('date')).toBe(mlSearch);
      expect(mlSearch.getSort()).toEqual('date');

      var operator = _.chain(mlSearch.getQuery().query.queries)
        .filter(function(obj) {
          return !!obj['operator-state'];
        }).filter(function(obj) {
          return obj['operator-state']['operator-name'] === 'sort';
        })
        .valueOf();

      expect(operator.length).toEqual(1);
      expect(operator[0]['operator-state']['state-name']).not.toBeUndefined();
      expect(operator[0]['operator-state']['state-name']).toEqual('date');
      expect(mlSearch.clearSort()).toBe(mlSearch);
      expect(mlSearch.getSort()).toBe(null);
    });

    it('gets and sets facet mode', function() {
      var mlSearch = factory.newContext();

      expect(mlSearch.getFacetMode()).toBe('and');
      expect(mlSearch.setFacetMode('or')).toBe(mlSearch);
      expect(mlSearch.getFacetMode()).toBe('or');

      //TODO: getQuery()
    });

    it('gets URL params config', function() {
      var mlSearch = factory.newContext();

      expect(mlSearch.getParamsConfig()).not.toBeNull;
      expect(mlSearch.getParamsConfig().separator).toEqual(':');
      expect(mlSearch.getParamsConfig().qtext).toEqual('q');
      expect(mlSearch.getParamsConfig().facets).toEqual('f');
      expect(mlSearch.getParamsConfig().sort).toEqual('s');
      expect(mlSearch.getParamsConfig().page).toEqual('p');

      // TODO: test with options
    });

    it('gets URL params keys', function() {
      var mlSearch = factory.newContext();
      var keys = ['q', 'f', 's', 'p'];

      expect( _.difference( mlSearch.getParamsKeys(), keys ).length ).toEqual(0);
    });
  });

  describe('#transforms-response', function () {

    var mockResults, mockPaginatedResults, mockResultsFacets;

    beforeEach(inject(function($injector) {
      mockResults = $injector.get('searchResults');
      mockPaginatedResults = $injector.get('searchResultsPaginated');
      mockResultsFacets = $injector.get('searchResultsWithFacets');
    }));

    it('should properly tag facets as active', function() {
      $httpBackend
        .expectGET(/\/v1\/search\?format=json&options=all&pageLength=10&start=1&structuredQuery=.*/)
        .respond(mockResultsFacets);

      var search = factory.newContext();
      var facets;

      search.selectFacet('my-facet', 'test')
      .search()
      .then(function(response){ facets = response.facets; });
      $httpBackend.flush();

      expect( facets['my-facet'].facetValues[0].selected ).toByTruthy;
      expect( facets['my-facet'].facetValues[1].selected ).not.toByTruthy;
    });

    it('rewrites search results metadata correctly', function() {
      $httpBackend
        .expectGET(/\/v1\/search\?format=json&options=all&pageLength=10&start=1&structuredQuery=.*/)
        .respond(mockResults);

      var searchContext = factory.newContext(),
          actual;

      searchContext.search().then(function(response) { actual = response; });
      $httpBackend.flush();

      expect(actual.results[0].metadata).toBeDefined();

      expect( _.isArray(actual.results[0].metadata.name.values) ).toBeTruthy();
      expect(actual.results[0].metadata.name['metadata-type']).toEqual('element');
      expect(actual.results[0].metadata.name.values.length).toBe(1);
      expect(actual.results[0].metadata.name.values[0]).toBe('Semantic News Search');

      expect( _.isArray(actual.results[0].metadata.series.values) ).toBeTruthy();
      expect(actual.results[0].metadata.series['metadata-type']).toEqual('element');
      expect(actual.results[0].metadata.series.values.length).toBe(2);
      expect(actual.results[0].metadata.series.values[0]).toBe('value1');
      expect(actual.results[0].metadata.series.values[1]).toBe('value2');
    });

    it('replaces Clark-notation namespaces with prefixes in search metadata', function() {
      var result = { 'metadata': [{'{http://example.com/ns}name':'Semantic News Search','metadata-type':'element'}] },
          mlSearch = factory.newContext();

      mlSearch.addNamespace({ prefix: 'ex', uri: 'http://example.com/ns' });
      mlSearch.transformMetadata(result);

      expect(result.metadata['{http://example.com/ns}name']).not.toBeDefined();
      expect(result.metadata['ex:name']).toBeDefined();
    });

    it('sets the page size correctly', function() {
      $httpBackend
        .expectGET(/\/v1\/search\?format=json&options=all&pageLength=5&start=6&structuredQuery=.*/)
        .respond(mockPaginatedResults);

      var searchContext = factory.newContext({
            options: 'all',
            pageLength: 5
          }),
          actual;

      // Go to the second page, with 5 results per page
      searchContext.setPage(2).search().then(function(response) { actual = response; });
      $httpBackend.flush();

      expect(actual.start).toEqual(6);
      expect(actual['page-length']).toEqual(5);
    });

    it('sets the transform correctly', function() {
      $httpBackend
        .expectGET(/\/v1\/search\?format=json&options=all&pageLength=5&start=6&structuredQuery=.*&transform=blah/)
        .respond(mockPaginatedResults);

      var searchContext = factory.newContext({
            options: 'all',
            pageLength: 5
          }),
          actual;

      // Go to the second page, with 5 results per page
      searchContext.setPage(2).setTransform('blah').search().then(function(response) { actual = response; });
      $httpBackend.flush();

      expect(actual.start).toEqual(6);
      expect(actual['page-length']).toEqual(5);
    });

  });

  describe('#facets', function () {

    it('selects facets correctly', function() {
      var searchContext = factory.newContext();
      // turn the structured query into a JSON string...
      var fullQuery = JSON.stringify(searchContext.selectFacet('foo', 'bar').getQuery());
      // ... grab the part I want and turn that back into JSON for easy access.
      var facetQuery = JSON.parse('{' + fullQuery.match(/"range-constraint-query":\s*{[^}]+}/)[0] + '}');

      expect(facetQuery['range-constraint-query']['constraint-name']).toEqual('foo');
      expect(Array.isArray(facetQuery['range-constraint-query'].value)).toBeTruthy();
      expect(facetQuery['range-constraint-query'].value.length).toEqual(1);
      expect(facetQuery['range-constraint-query'].value[0]).toEqual('bar');
    });

    it('clears a facet correctly', function() {
      var searchContext = factory.newContext();
      // make one facet selection:
      searchContext.selectFacet('foo', 'bar');
      // make another
      searchContext.selectFacet('cartoon', 'bugs bunny');
      var fullQuery = JSON.stringify(searchContext.getQuery());
      var fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
      expect(fooQuery).not.toBeNull();
      var cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
      expect(cartoonQuery).not.toBeNull();

      // now clear one selection:
      searchContext.clearFacet('foo', 'bar');

      fullQuery = JSON.stringify(searchContext.getQuery());
      fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
      expect(fooQuery).toBeNull();
      cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
      expect(cartoonQuery).not.toBeNull();

      // and clear the other one:
      searchContext.clearFacet('cartoon', 'bugs bunny');

      fullQuery = JSON.stringify(searchContext.getQuery());
      fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
      expect(fooQuery).toBeNull();
      cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
      expect(cartoonQuery).toBeNull();

      expect(searchContext.activeFacets.cartoon).not.toBeDefined();

    });

    it('clears all facets correctly', function() {
      var fullQuery, fooQuery, cartoonQuery;
      var searchContext = factory.newContext();
      // make one facet selection:
      searchContext.selectFacet('foo', 'bar');
      // make another
      searchContext.selectFacet('cartoon', 'bugs bunny');

      fullQuery = JSON.stringify(searchContext.getQuery());
      fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
      expect(fooQuery).not.toBeNull();
      cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
      expect(cartoonQuery).not.toBeNull();

      // clear both selections
      searchContext.clearAllFacets();

      fullQuery = JSON.stringify(searchContext.getQuery());
      fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
      expect(fooQuery).toBeNull();
      cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
      expect(cartoonQuery).toBeNull();

    });

    it('sets quoted value facets from parameters correctly', function() {
      var searchContext = factory.newContext();
      searchContext.results = {facets: {cartoon: {type: 'string', values: ['bugs bunny']}}};
      // select facet with space value
      searchContext.selectFacet('cartoon', 'bugs bunny');

      expect(searchContext.getParams().f[0]).toEqual('cartoon:"bugs bunny"');

      searchContext.fromParams(searchContext.getParams());
      $rootScope.$apply();

      expect(searchContext.getParams().f[0]).toEqual('cartoon:"bugs bunny"');

      expect(searchContext.activeFacets.cartoon.values[0]).toEqual('bugs bunny');
    });

  });

  describe('#showMoreFacets', function(){
    var searchContext, constraintConfig, myFacet, extraFacets;

    beforeEach(function() {
      searchContext = factory.newContext();
      constraintConfig = {
        options: {
          constraint: [{
            name: 'MyFacetName',
            range: {}
          }] } };
      myFacet = {facetValues: []};
      extraFacets = {
        'values-response': {
          name: 'MyFacetName',
          type: 'xs:string',
          'distinct-value': [ {frequency: 10, _value: 'First'} ]
        } };
    });

    it('returns additional facets correctly', function() {
      $httpBackend
        .expectGET('/v1/config/query/all/constraint?format=json')
        .respond(constraintConfig);
      $httpBackend
        .expectPOST('/v1/values/MyFacetName?limit=6&start=1')
        .respond(extraFacets);

      searchContext.showMoreFacets(myFacet, 'MyFacetName');
      $httpBackend.flush();
      expect(myFacet.facetValues).toContain(
          {name: 'First', value: 'First', count: 10});
    });

    it('returns `step` number of additional facets', function() {
      var myFacetValues = _.map(_.range(10), function(idx) {
        return { frequency: idx, _value: 'value-' + idx };
      });

      var myExtraFacets = _.clone(extraFacets);

      myExtraFacets['values-response']['distinct-value'] = _.take(myFacetValues, 5);

      $httpBackend
        .expectGET('/v1/config/query/all/constraint?format=json')
        .respond(constraintConfig);
      $httpBackend
        .expectPOST('/v1/values/MyFacetName?limit=6&start=1')
        .respond(extraFacets);

      searchContext.showMoreFacets(myFacet, 'MyFacetName');
      $httpBackend.flush();
      expect(myFacet.facetValues.length).toEqual(5);

      myExtraFacets['values-response']['distinct-value'] = myFacetValues;

      $httpBackend
        .expectGET('/v1/config/query/all/constraint?format=json')
        .respond(constraintConfig);
      $httpBackend
        .expectPOST('/v1/values/MyFacetName?limit=16&start=6')
        .respond(myExtraFacets);

      searchContext.showMoreFacets(myFacet, 'MyFacetName', 10);
      $httpBackend.flush();
      expect(myFacet.facetValues.length).toEqual(15);
    });

    it('correctly uses saved queryOption', function() {
      searchContext.options.queryOptions = 'queryOption';
      $httpBackend
        .expectGET('/v1/config/query/queryOption/constraint?format=json')
        .respond(constraintConfig);

      $httpBackend
        .whenPOST('/v1/values/MyFacetName?limit=6&start=1')
        .respond(extraFacets);
      searchContext.showMoreFacets(myFacet, 'MyFacetName');
      $httpBackend.flush();
    });

    it('errors when no matching constraints', function() {
      var emptyConstraintConfig = { options: { constraint: [] } };
      $httpBackend
        .whenGET('/v1/config/query/all/constraint?format=json')
        .respond(emptyConstraintConfig);
      expect(function() {
        searchContext.showMoreFacets(myFacet, 'MyFacetName');
        $httpBackend.flush(); }).toThrow('No constraint exists matching MyFacetName');
    });
  });

  describe('#url-params', function() {
    var mockOptionsConstraint, mockOptionsGrammer, mockOptionsColor;

    beforeEach(inject(function($injector) {
      mockOptionsConstraint = $injector.get('optionsConstraint');
      mockOptionsColor = $injector.get('optionsConstraintColor');
      mockOptionsGrammer = $injector.get('optionsWithGrammer');
    }));

    it('gets stored options', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsGrammer);

      var search = factory.newContext(),
          actual;

      search.getStoredOptions().then(function(response) { actual = response; });
      $httpBackend.flush();

      expect(actual).toEqual(mockOptionsGrammer);
    });

    it('should set search parameters', function() {
      var search = factory.newContext();

      expect(search.setText('blah').getParams().q).toEqual('blah');
      expect(search.setSort('yesterday').getParams().s).toEqual('yesterday');

      search = factory.newContext({
        params: {
          qtext: 'qtext',
          sort: 'orderby'
       }
      });

      expect(search.setText('blah').getParams().qtext).toEqual('blah');
      expect(search.setSort('yesterday').getParams().orderby).toEqual('yesterday');
      expect(search.selectFacet('name', 'value')).toBe(search);
      expect(search.getParams().f.length).toEqual(1);
      expect(search.getParams().f[0]).toEqual('name:value');
      expect(search.selectFacet('name', 'value2')).toBe(search);
      expect(search.getParams().f.length).toEqual(2);
      expect(search.getParams().f[1]).toEqual('name:value2');
    });

    it('should respect null URL params config', function() {
      var search = factory.newContext();
      search.setText('text').setPage(4);

      expect(search.getParams().q).toEqual('text');
      expect(search.getParams().p).toEqual(4);

      search = factory.newContext({
        params: { page: null }
      });
      search.setText('text').setPage(4);

      expect(search.getParams().q).toEqual('text');
      expect(search.getParams().p).toBeUndefined;

      search = factory.newContext({
        params: { qtext: null }
      });
      search.setText('text').setPage(4);

      expect(search.getParams().q).toBeUndefined;
      expect(search.getParams().p).toEqual(4);
    });

    it('should populate from search parameters', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsConstraint);

      var search = factory.newContext({
        params: { separator: '*_*' }
      });

      $location.search({
        q: 'blah',
        s: 'backwards',
        p: '3',
        f : [ 'my-facet2*_*facetvalue' ]
      });

      search.fromParams();
      $httpBackend.flush();

      expect(search.getText()).toEqual('blah');
      expect(search.getSort()).toEqual('backwards');
      expect(search.getPage()).toEqual(3);
      expect(search.getActiveFacets()['my-facet2'].values[0]).toEqual('facetvalue');

      var sort = _.chain(search.getQuery().query.queries)
        .filter(function(obj) {
          return !!obj['operator-state'];
        }).filter(function(obj) {
          return obj['operator-state']['operator-name'] === 'sort';
        })
        .valueOf();

      expect(sort[0]).toEqual({
        'operator-state': {
          'operator-name': 'sort',
          'state-name': 'backwards'
        }
      });

      search.clearAllFacets();

      $location.search({
        q: 'blah2',
        s: 'backwards',
        p: '4',
        f : [ 'my-facet*_*facetvalue' ]
      });

      search.fromParams();
      $rootScope.$apply();

      expect(search.getText()).toEqual('blah2');
      expect(search.getSort()).toEqual('backwards');
      expect(search.getPage()).toEqual(4);
      expect(search.getActiveFacets()['my-facet'].values[0]).toEqual('facetvalue');
      expect(search.getQuery().query.queries[0]['and-query'].queries.length).toEqual(2);

      search.clearAllFacets();
      expect(search.getActiveFacets()['my-facet']).toBeUndefined;

      $location.search({
        q: 'blah2',
        p: '4',
        f : [
          'my-facet*_*facetvalue',
          'my-facet*_*facetvalue2'
        ]
      });

      search.fromParams();
      $rootScope.$apply();

      expect(search.getText()).toEqual('blah2');
      expect(search.getSort()).toEqual('backwards');
      expect(search.getPage()).toEqual(4);
      expect(search.getActiveFacets()['my-facet'].values[0]).toEqual('facetvalue');
      expect(search.getActiveFacets()['my-facet'].values[1]).toEqual('facetvalue2');
      expect(search.getQuery().query.queries[0]['and-query'].queries.length).toEqual(2);
    });

    it('should allow prefix\'d URL params', function() {
      var search = factory.newContext({
        params: { prefix: 'test' }
      });

      expect( search.getParamsPrefix() ).toEqual('test:');

      search
      .setText('hi')
      .setPage(3)
      .selectFacet('color', 'blue');

      expect(search.getText()).toEqual('hi');
      expect(search.getPage()).toEqual(3);
      expect(search.getActiveFacets().color.values[0]).toEqual('blue');

      expect(search.getParams()['test:q']).toEqual('hi');
      expect(search.getParams()['test:p']).toEqual(3);
      expect(search.getParams()['test:f'][0]).toEqual('color:blue');
    });

    it('should allow prefix\'d URL params with custom prefixSeparator', function() {
      var search = factory.newContext({
        params: {
          prefix: 'test',
          prefixSeparator: '|'
        }
      });

      search
      .setText('hi')
      .setPage(3)
      .selectFacet('color', 'blue');

      expect(search.getText()).toEqual('hi');
      expect(search.getPage()).toEqual(3);
      expect(search.getActiveFacets().color.values[0]).toEqual('blue');

      expect(search.getParams()['test|q']).toEqual('hi');
      expect(search.getParams()['test|p']).toEqual(3);
      expect(search.getParams()['test|f'][0]).toEqual('color:blue');
    });

    it('should populate from facet URL params', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsColor);

      var search = factory.newContext();

      $location.search({ q: 'hi', f: 'color:blue' });
      search.fromParams();
      $httpBackend.flush();

      expect(search.getText()).toEqual('hi');
      expect(search.getActiveFacets().color.values[0]).toEqual('blue');

      $location.search({ q: 'hi' });
      search.fromParams();
      $rootScope.$apply();

      expect(search.getText()).toEqual('hi');
      expect(search.getActiveFacets().color).toBeUndefined;
    });

    it('should ignore prefix-mismatch facet URL params', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsColor);

      var search = factory.newContext({
        params: { prefix: 'test' }
      });

      $location.search({ 'test:q': 'hi', 'test:f': 'color:blue' });
      search.fromParams();
      $httpBackend.flush();

      expect(search.getText()).toEqual('hi');
      expect(search.getActiveFacets().color.values[0]).toEqual('blue');

      // prefixed w/ custom separator use case
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsColor);

      search = factory.newContext({
        params: {
          prefix: 'test',
          prefixSeparator: '|'
        }
      });

      $location.search({ 'test|q': 'hi', 'test|f': 'color:blue' });
      search.fromParams();
      $httpBackend.flush();

      expect(search.getText()).toEqual('hi');
      expect(search.getActiveFacets().color.values[0]).toEqual('blue');

      // prefix / unprefix'd
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsColor);

      search = factory.newContext({
        params: {
          prefix: 'test',
          prefixSeparator: '|'
        }
      });

      $location.search({ q: 'hi', 'test|f': 'color:blue' });
      search.fromParams();
      $httpBackend.flush();

      expect(search.getText()).toBeNull;
      expect(search.getActiveFacets().color.values[0]).toEqual('blue');

      // prefixed mis-match
      search = factory.newContext({
        params: {
          prefix: 'mytest',
          prefixSeparator: '|'
        }
      });

      $location.search({ 'mytest|q': 'hi', 'test|f': 'color:blue' });
      search.fromParams();
      $rootScope.$apply();

      expect(search.getText()).toEqual('hi');
      expect(search.getActiveFacets().color).toBeUndefined;
    });

    it('should handle URL params for multiple, concurrent searchContexts', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsColor);

      $httpBackend
        .expectGET('/v1/config/query/some?format=json')
        .respond(mockOptionsColor);

      $httpBackend
        .expectGET('/v1/config/query/others?format=json')
        .respond(mockOptionsColor);

      var first = factory.newContext({
        params: { prefix: 'a' }
      });

      var second = factory.newContext({
        queryOptions: 'some',
        params: { prefix: 's' }
      });

      var third = factory.newContext({
        queryOptions: 'others',
        params: { prefix: 'x' }
      });

      $location.search({ 'a:f': 'color:red', 's:f': 'color:blue', 'x:f': 'color:green'});

      first.fromParams();
      second.fromParams();
      third.fromParams();

      $httpBackend.flush();

      expect(first.getActiveFacets().color.values[0]).toEqual('red');
      expect(second.getActiveFacets().color.values[0]).toEqual('blue');
      expect(third.getActiveFacets().color.values[0]).toEqual('green');

      first.clearAllFacets();
      second.clearAllFacets();
      third.clearAllFacets();

      first.selectFacet('color', 'red');
      second.selectFacet('color', 'blue');
      third.selectFacet('color', 'green');

      var params = _.merge(first.getParams(), second.getParams(), third.getParams());

      expect(params['a:f'][0]).toEqual('color:red');
      expect(params['a:f'].length).toEqual(1);
      expect(params['s:f'][0]).toEqual('color:blue');
      expect(params['s:f'].length).toEqual(1);
      expect(params['x:f'][0]).toEqual('color:green');
      expect(params['x:f'].length).toEqual(1);
    });

  });

  it('gets suggests', function() {
    var suggestions = { suggestions : [
      'val1',
      'val2',
      'val3'
    ]};

    $httpBackend
      .expectPOST('/v1/suggest?format=json&options=all&partial-q=val')
      .respond(suggestions);

    var search = factory.newContext(),
        actual1, actual2;

    search.suggest('val').then(function(response) { actual1 = response; });
    $httpBackend.flush();

    expect(actual1).toEqual(suggestions);

    $httpBackend
      .expectPOST('/v1/suggest?format=json&options=all&partial-q=val1')
      .respond({ suggestions: [ 'val1' ]});

    search.suggest('val1').then(function(response) { actual2 = response; });
    $httpBackend.flush();

    expect(actual2.suggestions.length).toEqual(1);
    expect(actual2.suggestions[0]).toEqual('val1');
  });

});
