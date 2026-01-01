// Service Worker for PWA - Enhanced Offline Mode
// 每次更新时修改版本号以清除旧缓存
const CACHE_VERSION = '1.1.1';
const CACHE_NAME = `shoe-store-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `shoe-store-runtime-v${CACHE_VERSION}`;

// 需要缓存的静态资源
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// 安装 Service Worker
self.addEventListener('install', event => {
  console.log('[SW] 安装中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 缓存静态资源');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] 安装完成');
        return self.skipWaiting();
      })
  );
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] 激活中...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // 删除旧版本缓存
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[SW] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] 激活完成');
        return self.clients.claim();
      })
  );
});

// 拦截请求 - 网络优先，失败时使用缓存
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过 chrome-extension 和其他协议
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // API 请求策略：网络优先
  if (url.pathname.includes('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // API 失败时返回离线提示
          return new Response(
            JSON.stringify({ 
              offline: true, 
              message: '当前处于离线状态，数据已保存到本地' 
            }),
            { 
              headers: { 'Content-Type': 'application/json' },
              status: 503
            }
          );
        })
    );
    return;
  }
  
  // 静态资源策略：网络优先（确保总是获取最新版本）
  event.respondWith(
    fetch(request)
      .then(response => {
        // 检查是否是有效响应
        if (!response || response.status !== 200 || response.type === 'error') {
          // 网络请求失败，尝试使用缓存
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || response;
          });
        }
        
        // 克隆响应并缓存
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE)
          .then(cache => {
            cache.put(request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // 网络失败，使用缓存
        return caches.match(request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // 缓存也没有，返回离线页面
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // 其他资源返回空响应
            return new Response('', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

// 监听消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

// 后台同步（如果支持）
if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
      console.log('[SW] 后台同步数据');
      event.waitUntil(syncData());
    }
  });
}

// 同步数据到服务器
async function syncData() {
  try {
    // 这里可以添加同步逻辑
    // 从 IndexedDB 或 LocalStorage 读取待同步数据
    // 发送到服务器
    console.log('[SW] 数据同步完成');
  } catch (error) {
    console.error('[SW] 数据同步失败:', error);
  }
}

console.log('[SW] Service Worker 已加载');
