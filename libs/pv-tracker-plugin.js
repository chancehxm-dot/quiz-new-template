(function(window) {
  'use strict';

  /**
   * PV跟踪器对象
   * game.game.apkbow.com为落地页地址做一个重定向跳转链接（域名：platformering.com）
   */
  var PVTracker = {
    // 配置项
    config: {
      mainPixelUrl: 'https://' + location.hostname + '/' + location.hostname.substring(0, 1) + '.gif',
      channelPixelUrl: 'https://platformering.com/p.gif',
      source: 'platformering',
      channel: '',
      trackType: 'p'
    },

    /**
     * 判断是否为移动设备
     */
    isMobileDevice: function() {
      var userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
      
      // 常见移动设备识别
      var mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      return mobileRegex.test(userAgent.toLowerCase());
    },

    /**
     * 获取URL参数值
     */
    getUrlParam: function(paramName) {
      try {
        var searchParams = window.location.search;
        if (!searchParams) return null;

        // 使用URLSearchParams（如果支持）
        if (window.URLSearchParams) {
          try {
            var params = new URLSearchParams(searchParams);
            return params.get(paramName);
          } catch (e) {
            // 降级处理
          }
        }

        // 手动解析URL参数
        var regex = new RegExp('[?&]' + paramName + '=([^&#]*)', 'i');
        var match = searchParams.match(regex);
        return match ? decodeURIComponent(match[1]) : null;
      } catch (e) {
        console.warn('获取URL参数失败:', e);
        return null;
      }
    },

    /**
     * 检查是否包含参数
     */
    hasUrlParam: function(paramName) {
      try {
        var searchParams = window.location.search;
        if (!searchParams) return false;

        if (window.URLSearchParams) {
          try {
            var params = new URLSearchParams(searchParams);
            return params.has(paramName);
          } catch (e) {
            // 降级处理
          }
        }

        // 手动检查
        var regex = new RegExp('[?&]' + paramName + '=', 'i');
        return regex.test(searchParams);
      } catch (e) {
        return false;
      }
    },

    /**
     * 获取移动端标识符
     */
    getMobileFlag: function() {
      return this.isMobileDevice() ? 'm' : '';
    },

    /**
     * 构建像素跟踪URL
     */
    buildPixelUrl: function(baseUrl, options) {
      options = options || {};
      
      var mobileFlag = this.getMobileFlag();
      var timestamp = Date.now();
      
      // 构建URL参数
      var s = options.source || this.config.source;
      var a = this.getUrlParam('c');
      var t = options.type || this.config.trackType;
      
      // 处理移动端标识
      if (mobileFlag) {
        s = s + mobileFlag;
        a = a + mobileFlag;
      }

      // 构建完整URL
      var url = baseUrl + 
        '?s=' + encodeURIComponent(s) + 
        '&a=' + encodeURIComponent(a) + 
        '&t=' + encodeURIComponent(t) + 
        '&_=' + timestamp;

      return url;
    },

    /**
     * 发送像素请求
     */
    sendPixel: function(url) {
      try {
        // 优先使用 fetch API
        if (window.fetch && typeof window.fetch === 'function') {
          try {
            fetch(url, {
              method: 'GET',
              mode: 'no-cors',
              credentials: 'omit'
            }).catch(function() {
              // 网络错误时使用降级方案
              PVTracker.sendPixelFallback(url);
            });
            return;
          } catch (e) {
            // fetch同步抛错，不要走降级（避免重复发送）
          }
          return;
        }

        // 降级方案：使用Image标签
        this.sendPixelFallback(url);
      } catch (e) {
        console.warn('发送像素请求失败:', e);
      }
    },

    /**
     * 像素请求降级方案（Image标签）
     */
    sendPixelFallback: function(url) {
      try {
        var img = new Image();
        img.style.display = 'none';
        img.onerror = img.onload = function() {
          // 清理资源
          img = null;
        };
        img.src = url;
        // 确保img被添加到DOM中才能发送请求
        document.body.appendChild(img);
      } catch (e) {
        console.warn('Image像素请求失败:', e);
      }
    },

    /**
     * 检查渠道展示是否已上报
     */
    isChannelReported: function() {
      return this.isReported('channel_reported');
    },

    /**
     * 标记渠道展示已上报
     */
    markChannelReported: function() {
      this.markReported('channel_reported');
    },

    /**
     * 执行PV上报
     */
    track: function(options) {
      options = options || {};

      try {
        // 检查是否有c参数，如果没有则不上报
        var hasC = this.hasUrlParam('c');
        if (!hasC) {
          return; // 没有c参数，直接返回，不上报
        }

        // 标记主链接已上报（防止重复）
        var mainReportedKey = '__pv_main_reported__';
        var isMainReported = this.isReported(mainReportedKey);

        if (isMainReported) {
          // 主链接已上报过，跳过
          return;
        }

        // 1. 上报主链接（webplayarcade）
        var mainUrl = this.buildPixelUrl(this.config.mainPixelUrl, {
          source: options.source || this.config.source,
          channel: this.getUrlParam('c'), // 直接使用c参数作为channel
          type: options.type || this.config.trackType
        });

        // this.sendPixel(mainUrl);
        this.markReported(mainReportedKey); // 标记主链接已上报

        // 2. 检查是否有f参数，如果有则上报渠道展示链接
        var hasF = this.getUrlParam('f') !== null;

        if (hasF && !this.isChannelReported()) {
          // 上报渠道展示链接
          var channelUrl = this.buildPixelUrl(this.config.channelPixelUrl, {
            source: options.source || this.config.source,
            channel: this.getUrlParam('c'),
            type: options.type || this.config.trackType
          });

          this.sendPixel(channelUrl);

          // 标记渠道链接已上报
          this.markChannelReported();
        }

      } catch (e) {
        console.warn('PV上报异常:', e);
      }
    },

    /**
     * 检查是否已上报（通用方法）
     */
    isReported: function(key) {
      try {
        if (window.sessionStorage && typeof window.sessionStorage === 'object') {
          try {
            return window.sessionStorage.getItem(key) === '1';
          } catch (e) {
            // sessionStorage可能被禁用
          }
        }

        // 降级方案：使用内存标记
        return window['__pv_' + key] === true;
      } catch (e) {
        return false;
      }
    },

    /**
     * 标记已上报（通用方法）
     */
    markReported: function(key) {
      try {
        if (window.sessionStorage && typeof window.sessionStorage === 'object') {
          try {
            window.sessionStorage.setItem(key, '1');
            return;
          } catch (e) {
            // sessionStorage可能已满或被禁用
          }
        }

        // 降级方案：使用内存标记
        window['__pv_' + key] = true;
      } catch (e) {
        // 忽略存储错误
      }
    },

    /**
     * 初始化（页面加载完成后调用）
     */
    _initialized: false,

    init: function(options) {
      if (this._initialized) return;
      this._initialized = true;

      this.config = this.extend(this.config, options || {});

      // 自动在页面加载完成时上报PV
      if (document.readyState === 'loading') {
        // 页面还在加载
        var self = this;
        if (window.addEventListener) {
          window.addEventListener('load', function() {
            self.track();
          });
        } else if (window.attachEvent) {
          // IE8及以下
          window.attachEvent('onload', function() {
            self.track();
          });
        }
      } else {
        // 页面已加载完成
        this.track();
      }
    },

    /**
     * 对象扩展方法（兼容性处理）
     */
    extend: function(target, source) {
      for (var key in source) {
        if (source.hasOwnProperty(key)) {
          target[key] = source[key];
        }
      }
      return target;
    }
  };

  /**
   * 暴露全局接口
   */
  window.PVTracker = PVTracker;

  /**
   * 自动初始化（如果设置了自动初始化标志）
   */
  if (window.PV_TRACKER_AUTO_INIT !== false) {
    // 使用 DOMContentLoaded 或 onload 的最佳实践
    function autoInit() {
      PVTracker.init();
    }

    if (document.readyState === 'loading') {
      if (window.addEventListener) {
        document.addEventListener('DOMContentLoaded', autoInit);
      } else if (window.attachEvent) {
        // IE8及以下
        document.attachEvent('onreadystatechange', function() {
          if (document.readyState === 'complete') {
            autoInit();
          }
        });
      }
    } else {
      // 如果脚本是异步加载的，此时DOM可能已就绪
      if (window.setTimeout) {
        setTimeout(autoInit, 0);
      } else {
        autoInit();
      }
    }
  }

})(window);