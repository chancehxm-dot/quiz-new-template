(function () {
  'use strict';

  var KEY = '__url_params_carrier__';
  var initParams = {};

  function parseSearch(search) {
    var params = {};
    if (!search) return params;
    if (search.charAt(0) === '?') search = search.substring(1);
    if (!search) return params;
    var pairs = search.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var eq = pairs[i].indexOf('=');
      var key, val;
      if (eq === -1) {
        key = pairs[i];
        val = '';
      } else {
        key = pairs[i].substring(0, eq);
        val = pairs[i].substring(eq + 1);
      }
      if (key) {
        try {
          params[decodeURIComponent(key)] = val ? decodeURIComponent(val) : '';
        } catch (e) {}
      }
    }
    return params;
  }

  function buildSearch(params) {
    var parts = [];
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key] || ''));
      }
    }
    return parts.length ? '?' + parts.join('&') : '';
  }

  // Immediately parse & store current page params
  try {
    var stored = window.sessionStorage && sessionStorage.getItem(KEY);
    if (stored) {
      initParams = JSON.parse(stored);
    } else {
      initParams = parseSearch(window.location.search);
      if (window.sessionStorage) {
        sessionStorage.setItem(KEY, JSON.stringify(initParams));
      }
    }
  } catch (e) {
    initParams = parseSearch(window.location.search);
  }

  // Immediately set up click interception (capture phase)
  document.addEventListener('click', function (e) {
    // Walk up to find the nearest <a>
    var el = e.target;
    while (el && el !== document) {
      if (el.nodeType === 1 && el.tagName === 'A') break;
      el = el.parentNode;
    }
    if (!el || el.tagName !== 'A') return;
    if (e.defaultPrevented) return;

    var href = el.getAttribute('href');
    if (!href) return;
    href = href.trim();
    if (!href) return;
    if (href.charAt(0) === '#') return;
    if (href.indexOf('javascript:') === 0 || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
    if (el.getAttribute('target') === '_blank') return;
    if (el.hasAttribute('download')) return;

    // Parse target href: base + search + hash
    var hashIdx = href.indexOf('#');
    hashIdx = hashIdx === -1 ? href.length : hashIdx;
    var searchIdx = href.indexOf('?');
    if (searchIdx === -1 || searchIdx > hashIdx) searchIdx = hashIdx;

    var base = href.substring(0, searchIdx);
    var linkSearch = searchIdx < hashIdx ? href.substring(searchIdx, hashIdx) : '';
    var hash = hashIdx < href.length ? href.substring(hashIdx) : '';

    var targetParams = parseSearch(linkSearch);

    // Merge: target's own params take priority, initParams appended for missing keys
    for (var k in initParams) {
      if (initParams.hasOwnProperty(k) && !(k in targetParams)) {
        targetParams[k] = initParams[k];
      }
    }

    e.preventDefault();
    window.location.href = base + buildSearch(targetParams) + hash;
  }, true);

})();
