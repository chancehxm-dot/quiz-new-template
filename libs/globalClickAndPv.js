(function () {
  var lastClickTime = 0;

  function getUrlParam(e) {
    var t = new RegExp("(^|&)" + e + "=([^&]*)(&|$)", "i"),
      o = window.location.search.substr(1).match(t);
    return null != o ? o[2] : null;
  }

  // Truncate string safely
  function truncate(str, maxLen) {
    if (!str) return "";
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen);
  }

  // Get element path (tag names from target up to body)
  function getElementPath(el, maxDepth) {
    if (!el || el === document.body) return "body";
    var parts = [];
    var cur = el;
    var depth = 0;
    while (cur && cur !== document.body && depth < (maxDepth || 5)) {
      var tag = cur.tagName ? cur.tagName.toLowerCase() : "unknown";
      var id = cur.id ? "#" + cur.id : "";
      var cls = cur.className && typeof cur.className === "string"
        ? "." + cur.className.trim().split(/\s+/).slice(0, 2).join(".")
        : "";
      parts.unshift(tag + id + cls);
      cur = cur.parentElement;
      depth++;
    }
    return parts.join(" > ");
  }

  function trackClick(e) {
    var now = Date.now();
    // Throttle to max 5 clicks per second
    if (now - lastClickTime < 200) return;
    lastClickTime = now;

    var el = e.target || e.srcElement;
    if (!el) return;

    var tag = (el.tagName || "").toLowerCase();
    var elId = el.id ? "#" + el.id : "";
    var elClass = "";
    if (el.className && typeof el.className === "string") {
      elClass = "." + truncate(el.className.trim().split(/\s+/).slice(0, 2).join("."), 60);
    }
    var elText = truncate((el.textContent || el.innerText || "").trim().replace(/\s+/g, " "), 80);
    var elHref = el.href || "";
    var elSrc = el.src || "";
    var posX = e.pageX || (e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft));
    var posY = e.pageY || (e.clientY + (document.documentElement.scrollTop || document.body.scrollTop));

    // Build query string params
    var valC = getUrlParam("c");
    var str = valC || "google";

    var hostname = location.hostname;
    var domain = hostname.replace("www.", "").split(".")[0];

    var isMobile = navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i);

    var params = "";
    params += "&tag=" + encodeURIComponent(tag + elId + elClass);
    // params += "&txt=" + encodeURIComponent(elText);
    if (elHref) params += "&href=" + encodeURIComponent(truncate(elHref, 200));
    if (elSrc) params += "&src=" + encodeURIComponent(truncate(elSrc, 200));
    params += "&px=" + Math.round(posX) + "&py=" + Math.round(posY);
    params += "&path=" + encodeURIComponent(getElementPath(el, 4));
    params += "&s_=" + encodeURIComponent(truncate(location.pathname, 150));

    var beaconUrl;
    if (isMobile) {
      beaconUrl = "https://" + location.hostname + "/" + domain.substring(0, 1) + ".gif?s=" + hostname + "m&a=" + str + "m&t=gc&_=" + now + params;
    } else {
      beaconUrl = "https://" + location.hostname + "/" + domain.substring(0, 1) + ".gif?s=" + hostname + "&a=" + str + "&t=gc&_=" + now + params;
    }

    // Find closest <a> tag for link navigation
    function findLink(target) {
      var cur = target;
      while (cur && cur !== document.body) {
        if (cur.tagName === 'A' && cur.href && cur.href.indexOf('javascript:') !== 0 && cur.target !== '_blank') {
          return cur;
        }
        cur = cur.parentElement;
      }
      return null;
    }

    var link = findLink(el);

    if (link) {
      // <a> tag click: block, sendBeacon (GET via img), then jump
      e.preventDefault();
      e.stopPropagation();
      var finalHref = link.href;
      link.removeAttribute('href');

      function navigate() {
        window.location.href = finalHref;
      }

      // Use img GET so DevTools shows request status
      var img = document.createElement("img");
      img.style.display = "none";
      img.onload = navigate;
      img.onerror = navigate;
      // Fallback: force navigate after 500ms
      setTimeout(function () {
        navigate();
      }, 500);
      img.src = beaconUrl;
      document.body.appendChild(img);
    } else {
      // Non-link clicks: fire and forget via sendBeacon or img fallback
      if (navigator.sendBeacon) {
        navigator.sendBeacon(beaconUrl);
      } else {
        var img = document.createElement("img");
        img.style.display = "none";
        img.src = beaconUrl;
        document.body.appendChild(img);
      }
    }
  }

  // Attach to document for maximum coverage
  if (document.addEventListener) {
    document.addEventListener("click", trackClick, true);
  } else if (document.attachEvent) {
    document.attachEvent("onclick", trackClick);
  }
})();
