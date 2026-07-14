(function () {
  'use strict';

  // 存储已发送的追踪请求，避免重复发送
  let trackedEvents = new Set();
  let isAdClick = false;
  let lastClickTime = 0;

  // 等待DOM加载完成
  function domReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  // 获取URL参数
  function getUrlParam(name) {
    var regex = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var matches = window.location.search.substr(1).match(regex);
    return matches !== null ? matches[2] : null;
  }

  // 获取设备属性信息
  function getProperties() {
    let sh = window.screen.height;
    let sw = window.screen.width;
    let vh = window.visualViewport ? window.visualViewport.height : '';
    let vw = window.visualViewport ? window.visualViewport.width : '';
    let dpr = window.devicePixelRatio || '';
    let pf = navigator.platform || '';
    let ua = encodeURIComponent(navigator.userAgent || '');
    let core = navigator.hardwareConcurrency || '';
    let mem = navigator.deviceMemory || '';
    let langs = navigator.languages ? navigator.languages.join(',') : '';

    let glv = "";
    let glr = "";
    let canvas = document.createElement('canvas');
    canvas.id = 'webglCanvas';
    canvas.width = 1;
    canvas.height = 1;
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      let debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        glv = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        glr = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
    document.body.removeChild(canvas);

    return '&sh=' + sh + '&sw=' + sw + '&vh=' + vh + '&vw=' + vw + '&dpr=' + dpr +
      '&pf=' + pf + '&core=' + core + '&mem=' + mem + '&langs=' + langs +
      '&glv=' + encodeURIComponent(glv) + '&glr=' + encodeURIComponent(glr);
  }

  // 生成事件唯一标识符
  function generateEventId(element, eventType) {
    const rect = element.getBoundingClientRect();
    return `${eventType}_${rect.left}_${rect.top}_${rect.width}_${rect.height}_${Math.floor(Date.now() / 1000)}`;
  }

  // 发送点击追踪请求
  function sendClickTrack(eventType = 'c') {
    let valC = getUrlParam("c");
    let str = valC || "google";
    let pros = getProperties();

    const url = location.href;
    const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
    
    // 生成事件ID防止重复发送
    const eventId = `${str}_${eventType}_${Date.now()}`;
    if (trackedEvents.has(eventId)) {
      return; // 避免重复发送
    }
    trackedEvents.add(eventId);

    let trackImg = document.createElement("img");
    trackImg.style.display = 'none';

          function getDomainName() {
                const url = window.location.href;
                const hostname = new URL(url).hostname.replace('www.', '');

                // 移除可能的端口号
                const domain = hostname.split(':')[0];

                // 检查是否包含多个点，判断是否为二级或更高级域名
                const parts = domain.split('.');

                // 如果只有两个部分（如 example.com），则认为是一级域名
                if (parts.length === 2) {
                    // 返回不带后缀的主域名
                    return parts[0];
                }
                // 如果多于两个部分（如 sub.example.com），则是二级或更高级域名
                else if (parts.length > 2) {
                    // 返回完整的 hostname
                    return hostname;
                }
                // 如果只有一个部分（如 localhost），直接返回
                else {
                    return hostname;
                }
            }
            const DomainName = getDomainName();
    if (navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)) {
      trackImg.src = "https://" + location.hostname + "/" + domain.substring(0, 1) + ".gif?s=" + DomainName + "m&a=" + str + "m&t=" + eventType + "&_=" + Date.now() + pros;
    } else {
      trackImg.src = "https://" + location.hostname + "/" + domain.substring(0, 1) + ".gif?s=" + DomainName + "&a=" + str + "&t=" + eventType + "&_=" + Date.now() + pros;
    }

    document.body.appendChild(trackImg);
    // 短暂延迟后移除元素
    setTimeout(() => {
      if (trackImg.parentNode) {
        trackImg.parentNode.removeChild(trackImg);
      }
      // 一段时间后从已追踪集合中移除，避免内存泄漏
      setTimeout(() => {
        trackedEvents.delete(eventId);
      }, 60000);
    }, 1000);
  }

  // 检测Google Ads iframe点击的高级方法
  function detectGoogleAdsClick() {
    // 方法1: 监听 window.blur 事件结合活动元素检查
    window.addEventListener('blur', function() {
      // 检查焦点是否在 iframe 上
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === 'IFRAME') {
        const parentContainer = activeElement.closest('[id*="gpt-ad"], [id*="ad-"], .ad-container');
        if (parentContainer) {
          isAdClick = true;
          lastClickTime = Date.now();
          setTimeout(() => sendClickTrack('c'), 100);
        }
      }
    });

    // 方法2: 监听页面可见性变化
    document.addEventListener('visibilitychange', function() {
      if (document.hidden && (Date.now() - lastClickTime) < 1000) {
        // 页面变为隐藏状态且最近有点击广告区域的操作
        setTimeout(() => sendClickTrack('c'), 100);
      }
    });

    // 方法3: 监听页面失去焦点
    window.addEventListener('pagehide', function() {
      if ((Date.now() - lastClickTime) < 1000) {
        setTimeout(() => sendClickTrack('c'), 100);
      }
    });
  }

  // 初始化广告点击追踪
  function initAdClickTracking() {
    const adContainer = document.getElementById('div-gpt-ad-1776682481638-0');
    if (adContainer) {
      // 监听多种鼠标事件以提高捕获概率
      ['mousedown', 'mouseup', 'click'].forEach(eventType => {
        adContainer.addEventListener(eventType, function (event) {
          isAdClick = true;
          lastClickTime = Date.now();
          // 添加一个小延迟确保在页面跳转前发送请求
          setTimeout(() => sendClickTrack('c'), 100);
        }, true); // 使用捕获阶段
      });

      // 对于触摸设备，也监听触摸事件
      ['touchstart', 'touchend'].forEach(eventType => {
        adContainer.addEventListener(eventType, function (event) {
          isAdClick = true;
          lastClickTime = Date.now();
          setTimeout(() => sendClickTrack('c'), 100);
        }, true);
      });
    }

    // 启用Google Ads特定的检测方法
    detectGoogleAdsClick();

    // 增强通用iframe点击检测
    document.body.addEventListener('click', function (event) {
      const iframe = event.target.closest('iframe');
      if (iframe) {
        // 检查是否为广告 iframe（可根据实际广告容器ID或class判断）
        const adContainer = iframe.closest('[id*="gpt-ad"], [id*="ad-"], .ad-container');
        if (adContainer) {
          isAdClick = true;
          lastClickTime = Date.now();
          setTimeout(() => sendClickTrack('c'), 100);
        }
      }
    }, true); // 使用捕获阶段
  }

  // DOM加载完成后初始化
  domReady(initAdClickTracking);

})();