(function() {
    'use strict';
    
    // 等待页面完全加载
    function waitForPageLoad() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });
    }
    
    // 获取页面中所有的a标签（按文档顺序）
    function getAllATags() {
        // 排除一些可能不需要的链接，比如脚本中的链接
        const allLinks = Array.from(document.querySelectorAll('a[href]'));
        // 过滤掉可能不需要的链接（如纯JavaScript链接、锚点链接等）
        return allLinks.filter(link => {
            const href = link.getAttribute('href');
            // 排除javascript:和mailto:等协议
            if (href && (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('#'))) {
                return false;
            }
            // 排除已经有序号ID的链接（避免重复处理）
            if (link.id && link.id.startsWith('page-link-')) {
                return false;
            }
            return true;
        });
    }
    
    // 为所有a标签设置page-link-id
    function setLinkIds() {
        const links = getAllATags();
        let linkIndex = 1;
        
        links.forEach(link => {
            // 只为还没有page-link-id的链接设置ID
            if (!link.id || !link.id.startsWith('page-link-')) {
                link.id = `page-link-${linkIndex}`;
                linkIndex++;
            }
        });
    }
    
    // 使用MutationObserver监听DOM变化
    function observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdateIds = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // 检查是否有新的a标签被添加
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === 'A' || node.querySelector('a')) {
                                shouldUpdateIds = true;
                            }
                        }
                    });
                }
            });
            
            // 如果检测到新的a标签，重新设置所有ID
            if (shouldUpdateIds) {
                // 使用setTimeout确保DOM更新完成
                setTimeout(setLinkIds, 100);
            }
        });
        
        // 开始观察整个文档
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        return observer;
    }
    
    // 主函数
    async function initPageLinkIds() {
        // 等待页面加载完成
        await waitForPageLoad();
        
        // 初始设置ID
        setLinkIds();
        
        // 开始监听DOM变化
        const observer = observeDOMChanges();
        
        // 也可以监听页面可见性变化，确保在页面显示时重新检查
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(setLinkIds, 500);
            }
        });
        
        // 返回observer以便需要时可以停止监听
        return observer;
    }
    
    // 启动脚本
    initPageLinkIds().catch(console.error);
    
    // 为了兼容性，也提供一个全局函数用于手动触发
    window.setPageLinkIds = setLinkIds;
})();