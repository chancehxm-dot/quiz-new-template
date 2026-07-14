function createScriptCode(parent, code) {
  if (typeof parent == "undefined") {
    return;
  }
  var script = document.createElement("script");
  script.type = "text/javascript";
  try {
    script.appendChild(document.createTextNode(code));
  } catch (ex) {
    script.text = code;
  }
  parent.appendChild(script);
}
function createScriptUrl(parent, url, dataSet, fn) {
  if (typeof parent == "undefined") {
    return;
  }
  var scriptEle = document.createElement("script");
  scriptEle.async = true;
  scriptEle.src = url;
  if (dataSet) {
    scriptEle.dataset.id = dataSet;
  }
  parent.insertBefore(scriptEle, parent.lastChild);
  scriptEle.onload = fn || function () { };
}
// 获取URL参数
function getUrlParam(e) {
  var t = new RegExp("(^|&)" + e + "=([^&]*)(&|$)", "i"),
    o = window.location.search.substr(1).match(t);
  return null != o ? o[2] : null;
}
// const preload = getUrlParam("preload");
const _isLink = getUrlParam("_isLink");
let valC = getUrlParam("c");
let _isC = valC ? true : false;

// window.googletag = window.googletag || {cmd: []};
// var div-gpt-ad-1762330375774-0_slot;
// googletag.cmd.push(function() {

// 	var mapping = 	googletag.sizeMapping().addSize([0, 0], ['fluid',[250, 250],[300, 250],[336, 280]]).build();

// 	div-gpt-ad-1762330375774-0_slot = googletag.defineSlot("/23311508222/https://techsweet.shop//https://techsweet.shop/_div-gpt-ad-1762330375774-0",[[250, 250],[300, 250],[336, 280]], "div-gpt-ad-1762330375774-0")
// 							.defineSizeMapping(mapping)
// 							.setCollapseEmptyDiv(true)
// 							.addService(googletag.pubads());

// 					googletag.enableServices();

// });


// if (window.addEventListener) {
//   window.addEventListener("load", beforeLoadPage, false);
// } else if (window.attachEvent) {
//   window.attachEvent("onload", beforeLoadPage);
// } else {
//   window.onload = beforeLoadPage;
// }

function beforeLoadPage() {
  let str = "google";
  if (valC) {
    str = valC;
  }
  let pros = o_getProperties();
  let img = document.createElement("img");
  img.style.display = 'none';
  const url = location.href;
  const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
  if (navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)) {
    img.src = "https://" + location.hostname + "/" + domain.substring(0, 1) + ".gif?s=" + domain + "m&a=" + str + "m&t=p&_=" + Date.now() + pros;
  } else {
    img.src = "https://" + location.hostname + "/" + domain.substring(0, 1) + ".gif?s=" + domain + "&a=" + str + "&t=p&_=" + Date.now() + pros;
  }
  document.body.appendChild(img);

  //  window.googletag = window.googletag || {cmd: []};

  // googletag.cmd.push(function() {
  //   googletag.pubads().setTargeting('id_post_wp', ['<?php echo get_the_ID(); ?>']);
  //   if(window.location.search){
	// 	var queryString = window.location.search;
	// 	var urlParams = new URLSearchParams(queryString);
	// 	var utm_source = urlParams.get('utm_source');
	// 	var utm_medium = urlParams.get('utm_medium');
	// 	var utm_campaign = urlParams.get('utm_campaign');

	// 	if(utm_source){
	// 		googletag.pubads().setTargeting('utm_source', [utm_source]);
	// 	}

	// 	if(utm_medium){
	// 		googletag.pubads().setTargeting('utm_medium', [utm_medium]);
	// 	}

	// 	if(utm_campaign){
	// 		googletag.pubads().setTargeting('utm_campaign', [utm_campaign]);
	// 	}
	// }
  // })

// Interstitial
// googletag.cmd.push(function() {
//     var slot = googletag.defineOutOfPageSlot('/23311508222/ca-pub-1358196357438587-tag/ad_techsweet.shop_int_0', googletag.enums.OutOfPageFormat.INTERSTITIAL);
//     if (slot) slot.addService(googletag.pubads());
//     googletag.enableServices();
//     googletag.display(slot);
// })


// // Anchor
// googletag.cmd.push(function() {
//     var anchorSlot = googletag.defineOutOfPageSlot('/23311508222/ca-pub-1358196357438587-tag/ad_techsweet.shop_anchor_0', googletag.enums.OutOfPageFormat.TOP_ANCHOR);
//     if (anchorSlot) {
//         anchorSlot.addService(googletag.pubads());
//     }
//     googletag.enableServices();
//     googletag.display(anchorSlot);
// });

}

function o_getProperties() {
  let sh = window.screen.height
  let sw = window.screen.width
  let vh = window.visualViewport.height
  let vw = window.visualViewport.width
  let dpr = window.devicePixelRatio
  let pf = navigator.platform
  let ua = encodeURI(navigator.userAgent)
  let core = navigator.hardwareConcurrency || ''
  let mem = navigator.deviceMemory || ''
  let langs = navigator.languages
  let glv = ""
  let glr = ""
  let canvas = document.createElement('canvas')
  canvas.id = 'webglCanvas'
  canvas.width = 1
  canvas.height = 1
  canvas.style.display = 'none' // 隐藏 canvas
  document.body.appendChild(canvas)
  let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  if (gl) {
    let debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      glv = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      glr = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    }
  }
  return '&sh=' + sh + '&sw=' + sw + '&vh=' + vh + '&vw=' + vw + '&dpr=' + dpr + '&pf=' + pf + '&core=' + core + '&mem=' + mem + '&langs=' + langs + '&glv=' + encodeURI(glv) + '&glr=' + encodeURI(glr)
}