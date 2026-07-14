(function (window, document) {
    "use strict";
    window.googletag = window.googletag || { cmd: [] };

    // 广告配置
    const AD_CONFIG = {
        // 固定位广告配置
        fixed: [
            {
                id: 'div-gpt-ad-1783998391391-0',
                path: '/23350280235/ca-pub-3453606224623962-tag/ab_play.appbleep.com_300x250_10',
                sizes: [[300, 250], [336, 280]]
            },
            {
                id: 'div-gpt-ad-1783998364331-0',
                path: '/23350280235/ca-pub-3453606224623962-tag/ab_play.appbleep.com_336x280_10',
                sizes: [[300, 250], [336, 280]]
            },
        ],

        // 锚定广告配置（已停用：页面不再使用固定定位广告位）
        anchor: null,

        // 插屏广告配置
        interstitial: {
            path: '/23350280235/ca-pub-3453606224623962-tag/ab_play.appbleep.com_int_10',
            format: 'INTERSTITIAL'
        }
    };

    const AdxAdControl = {
        config: {
            cacheKey: 'adx_ad_limit_config_v2',
            cacheTime: 60000, // 1分钟缓存
            pvEndpoint: '/pv.gif',
            configEndpoint: null,
            fetchTimeout: 3000  // 新增：配置获取超时时间
        },

        // 初始化 - 改为异步
        init: async function (options = {}) {
            Object.assign(this.config, options);

            if (!this.config.configEndpoint) {
                const domain = window.location.hostname.replace('www.', '').split('.')[0];
                this.config.configEndpoint = `${window.location.origin}/${domain.substring(0, 1)}.json?ver=2.0`;
            }

            // 立即处理广告限制逻辑（不等待）
            await this.processAdLimitControl();
        },

        // 改进：并行处理 + 快速决策
        processAdLimitControl: async function () {
            const self = this;
            const urlParams = new URLSearchParams(window.location.search);
            const cParam = urlParams.get('c');
            const hasOnemobCookie = document.cookie.indexOf('onemob') !== -1;

            // 快速通道：有onemob cookie或无c参数 - 立即允许
            if (hasOnemobCookie || !cParam) {
                this.reportPv('p');
                this.executeAdRequest();
                return;
            }

            // 检查本地缓存（同步，极快）
            const cachedConfig = this.getCachedConfig();
            if (cachedConfig) {
                this.processWithConfig(cachedConfig, cParam, true);
                // 后台静默更新缓存（不阻塞）
                this.fetchConfig(cParam);
                return;
            }

            // 新配置需要获取，但设置超时
            await this.fetchConfigWithTimeout(cParam);
        },

        // 新增：带超时的配置获取
        fetchConfigWithTimeout: function (cParam) {
            return new Promise((resolve) => {
                const timeoutId = setTimeout(() => {
                    // 超时后使用默认行为（允许广告）
                    this.reportPv('p');
                    this.executeAdRequest();
                    resolve();
                }, this.config.fetchTimeout);

                this.fetchConfig(cParam, () => {
                    clearTimeout(timeoutId);
                    resolve();
                });
            });
        },

        // 改进：增加回调参数
        fetchConfig: function (cParam, callback) {
            const self = this;
            const xhr = new XMLHttpRequest();

            xhr.open('GET', this.config.configEndpoint, true);
            xhr.timeout = this.config.fetchTimeout;

            xhr.onload = function () {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        self.setCachedConfig(response);
                        self.processWithConfig(response, cParam, false);

                        // 设置插屏广告屏蔽列表
                        // console.log('AdxAdControl: 设置插屏广告屏蔽列表', response.clickblock);
                        if (response.clickblock && Array.isArray(response.clickblock)) {
                            GptAdControl.setInterstitialAdBlockList(response.clickblock);
                        }
                    } catch (e) {
                        console.error('AdxAdControl: 配置解析失败', e);
                        // 解析 2.0 失败时走正常广告请求
                        self.reportPv('p');
                        self.executeAdRequest();
                    }
                } else {
                    // 2.0 接口非 200，走正常广告请求
                    self.reportPv('p');
                    self.executeAdRequest();
                }
                callback && callback();
            };

            xhr.onerror = function () {
                // 2.0 接口请求错误，走正常广告请求
                self.reportPv('p');
                self.executeAdRequest();
                callback && callback();
            };

            xhr.ontimeout = function () {
                // 超时时允许广告请求（宽松策略）
                self.reportPv('p');
                self.executeAdRequest();
                callback && callback();
            };

            xhr.send();
        },

        // 执行广告请求（这里可以集成原有的广告加载逻辑）
        executeAdRequest: function () {
            // console.log('AdxAdControl: 执行广告请求');
            const self = this;
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function () {
                    // 触发自定义事件，让其他代码知道可以加载广告
                    self.triggerEvent('adxAdControl:allowAdRequest');
                });
            } else {
                self.triggerEvent('adxAdControl:allowAdRequest');
            }
        },

        // 新增：应用随机样式
        applyRandomStyle: function (iframe) {
            // %的概率应用样式
            if (Math.random() < 1) {
                // 设置CSS样式 pointer-events: none !important
                // iframe.style.cssText += ';pointer-events: none !important;';
                const css = `ins iframe { pointer-events: none !important; }`;
                const style = document.createElement('style');
                style.innerHTML = css;
                document.head.appendChild(style);
                // console.log('AdxAdControl: 已应用 pointer-events: none 样式到目标iframe');
            } else {
                // console.log('AdxAdControl: 未应用样式（随机未命中）');
            }
        },

        // 改进：使用flag防止重复处理
        processWithConfig: function (config, cParam, fromCache) {
            // 防止重复处理
            if (this._processed) return;
            this._processed = true;

            if (!config.adlimit || !Array.isArray(config.adlimit)) {
                this.reportPv('p');
                this.executeAdRequest();
                return;
            }

            const limitConfig = config.adlimit.find(item => item.c === cParam);

            if (!limitConfig) {
                this.reportPv('p');
                this.executeAdRequest();
                return;
            }

            const limit = parseInt(limitConfig.limit) || 0;

            if (limit <= 0) {
                this.reportPv('pn');
                this.blockAdRequest();
            } else {
                // 更新计数
                let currentCount;
                if (fromCache) {
                    // 命中缓存：按次减1，模拟在缓存有效期内的多次曝光
                    currentCount = this.updateLimitCount(cParam, limit);
                } else {
                    // 新配置：用最新limit重置本地计数
                    this.setLimitCount(cParam, limit);
                    currentCount = limit;
                }

                // 如果当前计数已经用完，则阻止广告请求
                if (currentCount <= 0 && fromCache) {
                    this.reportPv('pn');
                    this.blockAdRequest();
                    return;
                }

                this.reportPv('p');
                this.executeAdRequest();
            }
        },

        // 阻止广告请求
        blockAdRequest: function () {
            // console.log('AdxAdControl: 阻止广告请求');

            // 触发自定义事件，让其他代码知道需要阻止广告
            this.triggerEvent('adxAdControl:blockAdRequest');

            // 阻止GPT广告显示
            if (window.googletag && typeof googletag.pubads === 'function') {
                try {
                    googletag.pubads().disableInitialLoad();
                    // 清空已定义的广告位
                    googletag.destroySlots();
                } catch (e) {
                    console.warn('AdxAdControl: 清理GPT广告时出错', e);
                }
            }
        },

        // 缓存管理
        getCachedConfig: function () {
            try {
                const cached = localStorage.getItem(this.config.cacheKey);
                const timestamp = localStorage.getItem(`${this.config.cacheKey}_time`);

                if (cached && timestamp) {
                    const now = Date.now();
                    const cacheTime = parseInt(timestamp);

                    // 检查缓存是否在有效期内
                    if (now - cacheTime < this.config.cacheTime) {
                        return JSON.parse(cached);
                    } else {
                        // 缓存过期，清理
                        this.clearCache();
                    }
                }
            } catch (e) {
                console.error('AdxAdControl: 缓存读取失败', e);
            }
            return null;
        },

        setCachedConfig: function (config) {
            try {
                localStorage.setItem(this.config.cacheKey, JSON.stringify(config));
                localStorage.setItem(`${this.config.cacheKey}_time`, Date.now().toString());
            } catch (e) {
                console.error('AdxAdControl: 缓存设置失败', e);
            }
        },

        clearCache: function () {
            try {
                localStorage.removeItem(this.config.cacheKey);
                localStorage.removeItem(`${this.config.cacheKey}_time`);
            } catch (e) {
                console.error('AdxAdControl: 缓存清理失败', e);
            }
        },

        // 限制计数管理
        updateLimitCount: function (cParam, defaultLimit) {
            const countKey = `adx_ad_limit_count_${cParam}`;
            const tsKey = `${countKey}_time`;
            try {
                const now = Date.now();
                const cacheTsStr = localStorage.getItem(`${this.config.cacheKey}_time`);
                const cacheTs = cacheTsStr ? parseInt(cacheTsStr, 10) : 0;

                // 不在缓存有效期内：直接使用默认limit，不扣减
                if (!cacheTs || now - cacheTs >= this.config.cacheTime) {
                    const initLimit = parseInt(defaultLimit) || 0;
                    localStorage.setItem(countKey, initLimit.toString());
                    localStorage.setItem(tsKey, now.toString());
                    return initLimit;
                }

                // 在缓存有效期内：每次刷新减1
                const currentStr = localStorage.getItem(countKey);
                let current = parseInt(currentStr, 10);
                if (isNaN(current)) {
                    current = parseInt(defaultLimit) || 0;
                }

                let newCount = Math.max(0, current - 1);
                localStorage.setItem(countKey, newCount.toString());
                localStorage.setItem(tsKey, now.toString());
                return newCount;
            } catch (e) {
                console.error('AdxAdControl: 计数更新失败', e);
                return parseInt(defaultLimit) || 0;
            }
        },

        setLimitCount: function (cParam, count) {
            const countKey = `adx_ad_limit_count_${cParam}`;
            try {
                localStorage.setItem(countKey, count.toString());
            } catch (e) {
                console.error('AdxAdControl: 计数设置失败', e);
            }
        },

        getLimitCount: function (cParam) {
            const countKey = `adx_ad_limit_count_${cParam}`;
            try {
                return parseInt(localStorage.getItem(countKey)) || 0;
            } catch (e) {
                console.error('AdxAdControl: 计数获取失败', e);
                return 0;
            }
        },

        // PV上报
        reportPv: function (type) {
            // const pvUrl = `${this.config.pvEndpoint}?t=${type}&ts=${Date.now()}&v=2`;
            this.createImageRequest(type);
        },

        createImageRequest: function (pType) {
            let str = "google";
            let valC = this.getUrlParam("c");
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
            if (valC) {
                str = valC;
            }
            let pros = this.o_getProperties();
            let img = document.createElement("img");
            img.style.display = 'none';
            const url = location.href;
            const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
            if (navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)) {
                img.src = "https://" + location.hostname + "/" + domain.substring(0, 1) + ".gif?s=" + DomainName + "m&a=" + str + "m&t=" + pType + "&_=" + Date.now() + pros;
            } else {
                img.src = "https://" + location.hostname + "/" + domain.substring(0, 1) + ".gif?s=" + DomainName + "&a=" + str + "&t=" + pType + "&_=" + Date.now() + pros;
            }
        },

        // 事件触发
        triggerEvent: function (eventName, detail = {}) {
            const event = new CustomEvent(eventName, { detail });
            document.dispatchEvent(event);
        },

        // 工具方法：获取当前c参数
        getCurrentCParam: function () {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('c');
        },

        // 工具方法：检查是否有onemob cookie
        hasOnemobCookie: function () {
            return document.cookie.indexOf('onemob') !== -1;
        },

        // 手动重置（用于测试）
        reset: function () {
            this.clearCache();
            this._processed = false;
            const cParam = this.getCurrentCParam();
            if (cParam) {
                const countKey = `adx_ad_limit_count_${cParam}`;
                try {
                    localStorage.removeItem(countKey);
                } catch (e) {
                    console.error('AdxAdControl: 重置失败', e);
                }
            }
        },

        // 获取URL参数
        getUrlParam: function (e) {
            var t = new RegExp("(^|&)" + e + "=([^&]*)(&|$)", "i"),
                o = window.location.search.substr(1).match(t);
            return null != o ? o[2] : null;
        },

        // 获取设备属性
        o_getProperties: function () {
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
    };

    // 动态加载 GPT 脚本
    let __gptLoadPromise = null;
    function loadGptScript(src) {
        const GPT_SRC = src || 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        // 若已就绪则直接返回
        if (window.googletag && window.googletag.apiReady) {
            return Promise.resolve();
        }
        if (__gptLoadPromise) return __gptLoadPromise;

        __gptLoadPromise = new Promise(function (resolve, reject) {
            // 避免重复 script 注入
            if (document.getElementById('gpt-lib')) {
                const checkReady = function () {
                    if (window.googletag && window.googletag.apiReady) {
                        resolve();
                    } else {
                        setTimeout(checkReady, 50);
                    }
                };
                checkReady();
                return;
            }

            // 确保 cmd 队列存在
            window.googletag = window.googletag || { cmd: [] };

            var s = document.createElement('script');
            s.id = 'gpt-lib';
            s.async = true;
            s.src = GPT_SRC;

            s.onload = function () {
                // 等待 GPT 回调
                googletag.cmd.push(function () {
                    resolve();
                });
                // 防御性兜底，避免个别环境不回调
                setTimeout(function () {
                    if (!(window.googletag && window.googletag.apiReady)) {
                        resolve();
                    }
                }, 3000);
            };
            s.onerror = function (e) {
                reject(new Error('加载 gpt.js 失败'));
            };

            document.head.appendChild(s);
        });

        return __gptLoadPromise;
    }

    // GPT广告控制功能
    const GptAdControl = {
        _anchorSlot: null,
        _interstitialSlot: null,
        _initialized: false,
        // 插屏广告屏蔽配置
        _interstitialAdBlockList: null, // 改为null表示尚未加载

        // 初始化GPT广告控制
        initGptAds: function () {
            if (this._initialized) return;
            // console.log('GptAdControl: 初始化GPT广告');

            // 确保googletag对象和cmd数组存在
            window.googletag = window.googletag || {};
            if (!Array.isArray(googletag.cmd)) {
                googletag.cmd = [];
            }

            // 将初始化放入 cmd 队列，等待 GPT 准备好
            googletag.cmd.push(function () {
                try {
                    googletag.setConfig({
                       singleRequest: true,
                       collapseDiv: "BEFORE_FETCH",
                    });
                    googletag.enableServices();
                } catch (e) {
                    console.warn('GptAdControl: 初始化 pubads 时出错', e);
                }
            });

            this._initialized = true;
        },

        // 获取枚举值的安全方法
        getOutOfPageFormat: function (format) {
            // 仅在 enums 可用时返回有效枚举
            if (typeof window.googletag !== 'undefined' &&
                typeof googletag.enums !== 'undefined') {
                switch (format) {
                    case 'TOP_ANCHOR':
                        return googletag.enums.OutOfPageFormat.TOP_ANCHOR;
                    case 'INTERSTITIAL':
                        return googletag.enums.OutOfPageFormat.INTERSTITIAL;
                    default:
                        return undefined;
                }
            }
            console.warn('GptAdControl: googletag.enums 未就绪，跳过 OOP 定义');
            return undefined;
        },

        // 显示GPT广告
        displayGptAds: function () {
            // console.log('GptAdControl: 显示GPT广告');

            if (typeof window.googletag === 'undefined') {
                console.warn('GptAdControl: 未找到googletag对象，无法显示广告');
                return;
            }

            // 显示所有已定义的广告
            googletag.cmd.push(function () {
                // 处理固定位广告
                GptAdControl.displayFixedAds();

                // 处理锚定广告
                GptAdControl.displayAnchorAd();

                // 处理插屏广告
                GptAdControl.displayInterstitialAd();
            });
        },

        // 显示固定位广告
        displayFixedAds: function () {
            // 确保 googletag 对象和相关方法存在
            if (typeof googletag === 'undefined' ||
                typeof googletag.pubads !== 'function' ||
                typeof googletag.defineSlot !== 'function' ||
                typeof googletag.display !== 'function') {
                console.warn('GptAdControl: GPT API 尚未完全加载');
                return;
            }

            AD_CONFIG.fixed.forEach(function (ad) {
                const adElement = document.getElementById(ad.id);
                if (adElement) {
                    // 检查广告位是否已经定义，避免重复定义
                    const slots = googletag.pubads().getSlots();
                    const isSlotDefined = slots.some(slot => slot.getSlotElementId() === ad.id);

                    if (!isSlotDefined) {
                        // 如果广告位尚未定义，则定义它
                        googletag.defineSlot(ad.path, ad.sizes, ad.id).addService(googletag.pubads());
                    }

                    googletag.display(ad.id);
                }
            });
        },

        // 显示锚定广告
        displayAnchorAd: function () {
            if (!AD_CONFIG.anchor) return;
            window.googletag = window.googletag || { cmd: [] };

            if (typeof googletag === 'undefined' ||
                typeof googletag.pubads !== 'function' ||
                typeof googletag.defineOutOfPageSlot !== 'function') {
                console.warn('GptAdControl: GPT API 尚未完全加载');
                return;
            }
            const self = this;
            // 如果未缓存，则尝试从已存在的 slots 中获取
            if (!self._anchorSlot) {
                const existing = googletag.pubads().getSlots().find(function (slot) {
                    return slot.getAdUnitPath && slot.getAdUnitPath() === AD_CONFIG.anchor.path;
                });
                if (existing) self._anchorSlot = existing;
            }

            // 定义 OOP 锚定广告位
            if (!self._anchorSlot) {
                const anchorFormat = GptAdControl.getOutOfPageFormat(AD_CONFIG.anchor.format);
                if (!anchorFormat) {
                    console.warn('GptAdControl: 锚定广告枚举未就绪，跳过');
                    return;
                }
                const slot = googletag.defineOutOfPageSlot(
                    AD_CONFIG.anchor.path,
                    anchorFormat
                );
                if (slot) {
                    // console.log('GptAdControl: 锚定广告已定义');
                    slot.addService(googletag.pubads());
                    self._anchorSlot = slot;
                }
            }

            // 请求展示（OOP 用 refresh 请求，不调用 display(slot)）
            if (self._anchorSlot && typeof googletag.pubads === 'function') {
                // // console.log('GptAdControl: 锚定广告已请求展示', self._anchorSlot);
                googletag.pubads().refresh([self._anchorSlot]);
            }
        },

        // 显示插屏广告
        displayInterstitialAd: function () {
            const self = this;
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function () {
                var intSlot = googletag.defineOutOfPageSlot(AD_CONFIG.interstitial.path, googletag.enums.OutOfPageFormat.INTERSTITIAL);
                if (intSlot) {
                    intSlot.addService(googletag.pubads());
                }
                googletag.enableServices();
                if (intSlot) {
                    googletag.display(intSlot);
                    // 应用插屏广告屏蔽样式
                    // self.applyInterstitialAdBlockStyles();
                }
            });
        },

        // 应用插屏广告屏蔽样式
        applyInterstitialAdBlockStyles: function () {
            // 获取插屏广告屏蔽列表
            const blockList = this._interstitialAdBlockList;

            // 遍历屏蔽列表中的每个项目
            blockList.forEach(item => {
                const { adid, probability } = item;

                // 根据配置的概率决定是否应用样式
                const shouldApplyStyle = Math.random() * 100 < parseInt(probability);

                if (shouldApplyStyle) {
                    // 查找对应的元素并应用样式
                    const targetElement = document.getElementById(adid);
                    if (targetElement) {
                        targetElement.style.pointerEvents = 'none';
                        // console.log(`GptAdControl: 已为 ${adid} 应用 pointer-events: none 样式`);
                    }

                    // 同时添加全局CSS规则
                    const css = `
                        #${adid} {
                            pointer-events: none !important;
                        }
                    `;
                    const style = document.createElement('style');
                    style.innerHTML = css;
                    document.head.appendChild(style);
                }
            });
        },

        // 设置插屏广告屏蔽列表
        setInterstitialAdBlockList: function (blockList) {
            this._interstitialAdBlockList = Array.isArray(blockList) ? blockList : null;
            // 触发自定义事件通知列表已更新
            const event = new CustomEvent('adxAdControl:interstitialAdBlockListUpdated');
            document.dispatchEvent(event);
        },

        // 阻止GPT广告显示
        blockGptAds: function () {
            // console.log('GptAdControl: 阻止GPT广告显示');

            if (typeof window.googletag === 'undefined') {
                return;
            }

            try {
                googletag.cmd.push(function () {
                    if (typeof googletag.pubads === 'function') {
                        googletag.pubads().disableInitialLoad();
                    }
                });
            } catch (e) {
                console.warn('GptAdControl: 禁用GPT初始加载时出错', e);
            }
        },

        // 移除替代图片
        removeBannerPlaceholder: function () {
            const placeholder = document.getElementById('banner-placeholder');
            if (placeholder) {
                placeholder.remove();
            }
        },
        removeFixedPlaceholder: function () {
            const placeholder = document.getElementById('banner-placeholder-footer');
            if (placeholder) {
                placeholder.remove();
            }
        }
    };

    // 暴露到全局
    window.AdxAdControl = AdxAdControl;
    window.GptAdControl = GptAdControl;


    // 初始化GPT广告控制（按需动态加载）
    AdxAdControl.init();
    // GPT 脚本将在允许广告时再加载
    GptAdControl.initGptAds();

    // 监听 AdxAdControl 的允许广告事件
    document.addEventListener('adxAdControl:allowAdRequest', function () {
        // console.log('AdxAdControl 允许GPT广告请求');

        // 动态加载 GPT 脚本后再进行初始化和展示
        GptAdControl.displayGptAds();
    });

    // 监听阻止广告事件
    document.addEventListener('adxAdControl:blockAdRequest', function () {
        // console.log('AdxAdControl阻止GPT广告请求');
        // 阻止GPT广告
        GptAdControl.blockGptAds();
    });

    // 监听广告渲染结束事件，检测插屏广告是否已填充
    googletag.cmd.push(function () {
        googletag.pubads().addEventListener('slotRenderEnded', function (event) {
            // 只处理插屏广告且已填充的情况
            if (event.slot.getAdUnitPath() === AD_CONFIG.interstitial.path && event.isEmpty === false) {
                // console.log('GptAdControl: 检测到插屏广告已填充');
                // 创建处理函数
                function processInterstitialAd() {
                    // 获取插屏广告屏蔽列表
                    const blockList = GptAdControl._interstitialAdBlockList;
                    // console.log('GptAdControl: 插屏广告屏蔽列表', blockList);
                    // 确保列表已加载且为数组
                    if (!Array.isArray(blockList)) {
                        return;
                    }

                    // 从配置中查找adid为ad-filled-init-1的项
                    const adConfig = blockList.find(item => item.adid === 'ad-filled-init-1');

                    // console.log('GptAdControl: 插屏广告配置', adConfig);
                    // 检查配置是否存在
                    if (adConfig) {
                        // 根据配置的概率决定是否注入CSS代码
                        const shouldApplyStyle = Math.random() * 100 < parseInt(adConfig.probability);

                        if (shouldApplyStyle) {
                            // 查找广告iframe并设置样式
                            const iframes = document.querySelectorAll('iframe');
                            let adIframe = null;

                            // 遍历所有iframe找到插屏广告iframe
                            for (let i = 0; i < iframes.length; i++) {
                                const iframe = iframes[i];
                                if (iframe.parentElement &&
                                    iframe.parentElement.hasAttribute('data-google-container-id') &&
                                    iframe.src.includes('googlesyndication')) {
                                    adIframe = iframe;
                                    break;
                                }
                            }

                            if (adIframe) {
                                // 应用pointer-events: none样式 
                                adIframe.style.pointerEvents = 'none !important';
                                const css = `
                                    iframe[src*="googlesyndication"][src*="shop_int_10"] {
                                        pointer-events: none !important;
                                    }
                                    ins iframe { pointer-events: none !important; }`;
                                const style = document.createElement('style');
                                style.innerHTML = css;
                                document.head.appendChild(style);

                                // // console.log('AdxAdControl: 已为插屏广告iframe应用 pointer-events: none 样式');
                            } else {
                                // 备用方案：通过CSS注入
                                const css = `
                                    iframe[src*="googlesyndication"][src*="shop_int_10"] {
                                        pointer-events: none !important;
                                    }
                                     ins iframe { pointer-events: none !important; }
                                `;
                                const style = document.createElement('style');
                                style.innerHTML = css;
                                document.head.appendChild(style);
                                // console.log('AdxAdControl: 已通过CSS注入方式为插屏广告应用 pointer-events: none 样式');
                            }
                        } else {
                            // // console.log('AdxAdControl: 未应用样式（随机未命中）');
                        }
                    }
                }

                // 如果配置已加载，则立即处理
                if (Array.isArray(GptAdControl._interstitialAdBlockList)) {
                    // console.log('GptAdControl: 配置已加载，立即处理');
                    processInterstitialAd();
                } else {
                    // 否则等待配置加载完成后再处理
                    // console.log('GptAdControl: 等待配置加载完成');
                    document.addEventListener('adxAdControl:interstitialAdBlockListUpdated', processInterstitialAd, { once: true });
                }
            }
        });
    });

    // 添加函数来检查广告素材是否存在
    function checkAdContentExists(slotId) {
        const adContainer = document.getElementById(slotId);
        if (adContainer) {
            // 检查是否有广告素材（例如iframe，img等）
            const hasAdContent = adContainer.querySelector('iframe, img, video, object, embed, canvas');
            return !!hasAdContent;
        }
        return false;
    }

    // 添加函数来检查素材是否已注入并调用webview接口
    function checkAndCallWebViewInterface(slotId, adPosition) {
        // 检查c参数是否为 
        const urlParams = new URLSearchParams(window.location.search);
        const cParam = urlParams.get('c');

        // 如果是SDicseeQC或者没有c参数，不执行webview通信
        if (cParam === 'SDicseeQC' || !cParam) {
            return;
        }

        // 检查广告容器中是否包含iframe或其他广告内容
        const adContainer = document.getElementById(slotId);
        if (adContainer) {
            // 检查是否有广告素材（例如iframe，img等）
            const hasAdContent = adContainer.querySelector('iframe, img, video, object, embed, canvas');

            if (hasAdContent) {
                // 调用webview通信接口
                if (typeof window.native !== 'undefined' && typeof window.native.postMessage === 'function') {
                    const message = JSON.stringify({
                        command: 'hideBanner',
                        lat: adPosition // 0=顶部，1=底部
                    });
                    window.native.postMessage(message);
                }
            }
        }
    }

})(window, document);