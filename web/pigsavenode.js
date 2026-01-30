// PIGsavenode v1.0.0 - ComfyUI节点收藏插件

// 全局变量
let favoritesData = { categories: [], favorites: [] };
let currentCategory = '全部';
let searchKeyword = '';  // 搜索关键词
let app = null;  // ComfyUI app实例

// 获取ComfyUI app实例
function getComfyApp() {
    if (!app && window.app) {
        app = window.app;
    }
    return app;
}

// 创建悬浮按钮
function createButton() {
    // 检查按钮是否已存在
    if (document.querySelector('.pigsavenode-btn')) {
        return;
    }
    
    // 创建按钮元素
    const button = document.createElement('button');
    button.className = 'pigsavenode-btn';
    button.innerHTML = '🐷';
    button.title = 'PIGsavenode - 节点收藏';
    
    // 按钮样式 - 放在左上角
    button.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #ff6b9d 0%, #c06c84 100%);
        border: 2px solid #c06c84;
        border-radius: 50%;
        color: white;
        font-size: 24px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 4px 15px rgba(255, 107, 157, 0.4);
        transition: transform 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // 悬停效果
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
    });
    
    // 拖拽功能
    let isDragging = false;
    let dragStartX, dragStartY;
    let buttonStartX, buttonStartY;
    let hasMoved = false;
    
    button.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        
        isDragging = true;
        hasMoved = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        
        const rect = button.getBoundingClientRect();
        buttonStartX = rect.left;
        buttonStartY = rect.top;
        
        button.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;
        
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            hasMoved = true;
        }
        
        let newX = buttonStartX + deltaX;
        let newY = buttonStartY + deltaY;
        
        const maxX = window.innerWidth - button.offsetWidth;
        const maxY = window.innerHeight - button.offsetHeight;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        button.style.left = newX + 'px';
        button.style.top = newY + 'px';
        button.style.right = 'auto';
        button.style.bottom = 'auto';
    });
    
    document.addEventListener('mouseup', (e) => {
        if (isDragging) {
            isDragging = false;
            button.style.cursor = 'pointer';
            
            if (!hasMoved) {
                toggleBrowser();
            }
        }
    });
    
    document.body.appendChild(button);
}

// 切换浏览器显示/隐藏
function toggleBrowser() {
    let browser = document.getElementById('pigsavenode-browser');
    
    if (browser) {
        if (browser.style.display === 'none') {
            browser.style.display = 'flex';
            loadFavorites();
        } else {
            browser.style.display = 'none';
        }
    } else {
        createBrowser();
    }
}

// 创建浏览器窗口
function createBrowser() {
    // 窗口更小，不遮挡侧边栏
    const width = 280;  // 固定宽度280px
    const height = window.innerHeight - 180;  // 高度稍小，底部留空间
    const left = 70;  // 左侧70px，避开侧边栏
    const top = 80;   // 顶部80px，往下移动
    
    const browser = document.createElement('div');
    browser.id = 'pigsavenode-browser';
    
    browser.style.cssText = `
        position: fixed;
        left: ${left}px;
        top: ${top}px;
        width: ${width}px;
        height: ${height}px;
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
        z-index: 9998;
        display: flex;
        flex-direction: column;
        font-family: 'Segoe UI', Arial, sans-serif;
    `;
    
    browser.innerHTML = `
        <!-- 标题栏 -->
        <div id="pig-title-bar" style="
            background: linear-gradient(135deg, #ff6b9d 0%, #c06c84 100%);
            color: white;
            padding: 12px 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 10px 10px 0 0;
            cursor: move;
            user-select: none;
        ">
            <div style="font-size: 16px; font-weight: bold;">
                🐷 PIGsavenode - 节点收藏
            </div>
            <button id="pig-close-btn" style="
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 2px 8px;
                border-radius: 4px;
                transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">✕</button>
        </div>
        
        <!-- 工具栏 -->
        <div style="padding: 10px 15px; background: #0d0d0d; border-bottom: 1px solid #333;">
            <!-- 搜索框 -->
            <div style="position: relative; margin-bottom: 8px;">
                <input type="text" id="search-input" placeholder="🔍 搜索节点名称、类型..." style="
                    width: 100%;
                    padding: 8px 30px 8px 12px;
                    background: #2a2a2a;
                    border: 1px solid #444;
                    color: #e0e0e0;
                    border-radius: 4px;
                    font-size: 12px;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                ">
                <button id="clear-search-btn" style="
                    position: absolute;
                    right: 6px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: transparent;
                    border: none;
                    color: #888;
                    cursor: pointer;
                    padding: 4px;
                    font-size: 14px;
                    display: none;
                    transition: color 0.2s;
                " title="清空搜索">✕</button>
            </div>
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
                <select id="category-filter" style="padding: 6px 12px; background: #2a2a2a; border: 1px solid #444; color: #e0e0e0; cursor: pointer; border-radius: 4px; font-size: 12px; flex: 1;">
                    <option value="全部">全部分类</option>
                </select>
                <button id="add-category-btn" title="新建分类" style="padding: 6px 10px; background: #ff6b9d; border: 1px solid #ff6b9d; color: white; cursor: pointer; border-radius: 4px; font-size: 12px;">➕</button>
                <button id="delete-category-btn" title="删除当前分类" style="padding: 6px 10px; background: #e74c3c; border: 1px solid #e74c3c; color: white; cursor: pointer; border-radius: 4px; font-size: 12px;">🗑️</button>
            </div>
            <button id="save-selected-btn" style="width: 100%; padding: 8px; background: linear-gradient(135deg, #ff6b9d 0%, #c06c84 100%); border: none; color: white; cursor: pointer; border-radius: 4px; font-size: 13px; font-weight: bold;">
                ⭐ 收藏选中的节点/节点组
            </button>
            <div style="color: #666; font-size: 11px; margin-top: 6px; text-align: center;">
                选中多个节点可收藏为节点组（保持连接）
            </div>
        </div>
        
        <!-- 主内容区 -->
        <div style="flex: 1; display: flex; overflow: hidden;">
            <!-- 收藏列表 -->
            <div id="favorites-content" style="flex: 1; padding: 15px; overflow: auto; background: #1a1a1a;">
                <div style="text-align: center; padding: 50px; color: #888;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🐷</div>
                    <p style="color: #999;">暂无收藏节点</p>
                    <p style="color: #666; font-size: 12px; margin-top: 10px;">拖拽ComfyUI节点到此窗口即可收藏</p>
                </div>
            </div>
        </div>
        
        <!-- 状态栏 -->
        <div id="pig-status-bar" style="
            padding: 8px 15px;
            background: #0d0d0d;
            border-top: 1px solid #333;
            font-size: 12px;
            color: #888;
            border-radius: 0 0 10px 10px;
        ">
            准备就绪
        </div>
    `;
    
    document.body.appendChild(browser);
    
    // 绑定事件
    document.getElementById('pig-close-btn').addEventListener('click', () => {
        browser.style.display = 'none';
    });
    
    document.getElementById('category-filter').addEventListener('change', (e) => {
        currentCategory = e.target.value;
        renderFavorites();
    });
    
    document.getElementById('add-category-btn').addEventListener('click', addCategory);
    
    document.getElementById('delete-category-btn').addEventListener('click', deleteCategory);
    
    document.getElementById('save-selected-btn').addEventListener('click', saveSelectedNodes);
    
    // 搜索功能
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    
    // 搜索输入事件
    searchInput.addEventListener('input', (e) => {
        searchKeyword = e.target.value.trim().toLowerCase();
        clearSearchBtn.style.display = searchKeyword ? 'block' : 'none';
        renderFavorites();
    });
    
    // 搜索框焦点效果
    searchInput.addEventListener('focus', () => {
        searchInput.style.borderColor = '#ff6b9d';
        searchInput.style.outline = 'none';
    });
    
    searchInput.addEventListener('blur', () => {
        searchInput.style.borderColor = '#444';
    });
    
    // 清空搜索按钮
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchKeyword = '';
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
        renderFavorites();
    });
    
    clearSearchBtn.addEventListener('mouseenter', () => {
        clearSearchBtn.style.color = '#ff6b9d';
    });
    
    clearSearchBtn.addEventListener('mouseleave', () => {
        clearSearchBtn.style.color = '#888';
    });
    
    // 支持快捷键 Ctrl+F 或 Cmd+F 聚焦搜索框
    document.addEventListener('keydown', (e) => {
        const browser = document.getElementById('pigsavenode-browser');
        if (browser && browser.style.display !== 'none') {
            // Ctrl+F 或 Cmd+F 聚焦搜索
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
            // ESC 键清空搜索
            if (e.key === 'Escape' && document.activeElement === searchInput) {
                searchInput.value = '';
                searchKeyword = '';
                clearSearchBtn.style.display = 'none';
                renderFavorites();
                searchInput.blur();
            }
        }
    });
    
    // 添加窗口拖拽功能
    const titleBar = document.getElementById('pig-title-bar');
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    titleBar.addEventListener('mousedown', (e) => {
        // 如果点击的是关闭按钮，不触发拖拽
        if (e.target.id === 'pig-close-btn') return;
        
        isDragging = true;
        dragOffsetX = e.clientX - browser.offsetLeft;
        dragOffsetY = e.clientY - browser.offsetTop;
        titleBar.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const newLeft = e.clientX - dragOffsetX;
        const newTop = e.clientY - dragOffsetY;
        
        // 限制窗口不超出屏幕边界
        const maxLeft = window.innerWidth - browser.offsetWidth;
        const maxTop = window.innerHeight - browser.offsetHeight;
        
        browser.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
        browser.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            titleBar.style.cursor = 'move';
        }
    });
    
    // ESC键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const browser = document.getElementById('pigsavenode-browser');
            if (browser && browser.style.display !== 'none') {
                browser.style.display = 'none';
            }
        }
    });
    
    // 初始化
    loadFavorites();
    
}

// 加载收藏列表
async function loadFavorites() {
    try {
        const response = await fetch('/pigsavenode/api/favorites');
        const result = await response.json();
        
        if (result.success) {
            favoritesData = result.data;
            updateCategoryFilter();
            renderFavorites();
        }
    } catch (error) {
        console.error('[PIGsavenode] 加载收藏失败:', error);
    }
}

// 更新分类过滤器
function updateCategoryFilter() {
    const filter = document.getElementById('category-filter');
    if (!filter) return;
    
    const currentValue = filter.value;
    filter.innerHTML = '<option value="全部">全部分类</option>';
    
    favoritesData.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        filter.appendChild(option);
    });
    
    filter.value = currentValue;
}

// 搜索过滤函数
function matchesSearch(fav, keyword) {
    if (!keyword) return true;
    
    const searchText = keyword.toLowerCase();
    
    // 搜索标题
    if (fav.title && fav.title.toLowerCase().includes(searchText)) {
        return true;
    }
    
    // 搜索类型
    if (fav.type && fav.type.toLowerCase().includes(searchText)) {
        return true;
    }
    
    // 搜索描述
    if (fav.description && fav.description.toLowerCase().includes(searchText)) {
        return true;
    }
    
    // 如果是节点组，搜索组内节点的信息
    if (fav.isGroup && fav.nodes) {
        return fav.nodes.some(node => {
            return (node.title && node.title.toLowerCase().includes(searchText)) ||
                   (node.type && node.type.toLowerCase().includes(searchText));
        });
    }
    
    return false;
}

// 渲染收藏列表
function renderFavorites() {
    const content = document.getElementById('favorites-content');
    const statusBar = document.getElementById('pig-status-bar');
    
    if (!content) return;
    
    let favorites = favoritesData.favorites;
    
    // 过滤分类
    if (currentCategory !== '全部') {
        favorites = favorites.filter(f => f.category === currentCategory);
    }
    
    // 搜索过滤
    if (searchKeyword) {
        favorites = favorites.filter(f => matchesSearch(f, searchKeyword));
    }
    
    if (favorites.length === 0) {
        if (searchKeyword || currentCategory !== '全部') {
            content.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #888;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                    <p style="color: #999;">未找到匹配的节点</p>
                    <p style="color: #666; font-size: 12px; margin-top: 10px;">${searchKeyword ? `搜索关键词: "${searchKeyword}"` : '请尝试调整筛选条件'}</p>
                </div>
            `;
            statusBar.textContent = searchKeyword ? `搜索: "${searchKeyword}"` : '';
        } else {
            content.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #888;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🐷</div>
                    <p style="color: #999;">暂无收藏节点</p>
                    <p style="color: #666; font-size: 12px; margin-top: 10px;">拖拽ComfyUI节点到此窗口即可收藏</p>
                </div>
            `;
            statusBar.textContent = '';
        }
        return;
    }
    
    // 按分类分组
    const grouped = {};
    favorites.forEach(fav => {
        const cat = fav.category || '默认分类';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(fav);
    });
    
    content.innerHTML = Object.keys(grouped).map(category => `
        <div style="margin-bottom: 20px;">
            <div style="font-size: 14px; font-weight: bold; color: #ff6b9d; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #333;">
                📁 ${category}
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                ${grouped[category].map(fav => {
                    const isGroup = fav.isGroup || false;
                    const nodeCount = fav.nodeCount || (isGroup ? (fav.nodes ? fav.nodes.length : 0) : 1);
                    const icon = isGroup ? '🔗' : '📦';
                    const badge = isGroup ? `<span style="background: rgba(255, 107, 157, 0.3); color: #ff6b9d; font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: 6px;">${nodeCount}个节点</span>` : '';
                    
                    // 节点组使用粉色/紫色系，单个节点使用蓝色系
                    const bgColor = isGroup ? '#2d1a2d' : '#1a1f2a';  // 节点组：深紫红，单个节点：深蓝灰
                    const hoverBgColor = isGroup ? '#3d2540' : '#1f2a3a';  // 悬停时的背景色
                    const titleColor = isGroup ? '#ffb3d9' : '#b3d9ff';  // 标题颜色
                    
                    return `
                    <div class="favorite-item ${isGroup ? 'group-item' : 'single-item'}" data-id="${fav.id}" data-node='${JSON.stringify(fav).replace(/'/g, "&#39;")}' draggable="true" style="
                        padding: 7px;
                        background: ${bgColor};
                        border: none;
                        border-radius: 6px;
                        cursor: move;
                        transition: all 0.2s;
                        position: relative;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div class="fav-title" style="font-size: 14px; font-weight: bold; color: ${titleColor}; flex: 1; cursor: text; display: flex; align-items: center;" title="双击重命名">
                                <span style="margin-right: 6px;">${icon}</span>
                                <span>${fav.title || fav.type || '未知节点'}</span>
                                ${badge}
                            </div>
                            <div style="display: flex; gap: 4px;">
                                <button class="rename-fav-btn" data-id="${fav.id}" data-title="${(fav.title || fav.type || '').replace(/"/g, '&quot;')}" style="
                                    background: rgba(102, 126, 234, 0.2);
                                    border: 1px solid rgba(102, 126, 234, 0.3);
                                    color: #667eea;
                                    font-size: 12px;
                                    cursor: pointer;
                                    padding: 2px 6px;
                                    border-radius: 3px;
                                    transition: background 0.2s;
                                ">✏️</button>
                                <button class="delete-fav-btn" data-id="${fav.id}" style="
                                    background: rgba(255, 0, 0, 0.2);
                                    border: 1px solid rgba(255, 0, 0, 0.3);
                                    color: #ff6b6b;
                                    font-size: 12px;
                                    cursor: pointer;
                                    padding: 2px 6px;
                                    border-radius: 3px;
                                    transition: background 0.2s;
                                ">🗑️</button>
                            </div>
                        </div>
                        <div style="font-size: 11px; color: ${isGroup ? '#cc99cc' : '#99b3cc'};">
                            ${fav.description || ''}
                        </div>
                    </div>
                `;
                }).join('')}
            </div>
        </div>
    `).join('');
    
    // 绑定事件
    content.querySelectorAll('.favorite-item').forEach(item => {
        const isGroup = item.classList.contains('group-item');
        const originalBg = isGroup ? '#2d1a2d' : '#1a1f2a';
        const hoverBg = isGroup ? '#3d2540' : '#1f2a3a';
        
        item.addEventListener('mouseenter', function() {
            this.style.background = hoverBg;
        });
        item.addEventListener('mouseleave', function() {
            this.style.background = originalBg;
        });
        
        // 单击添加到画布
        item.addEventListener('click', function(e) {
            // 如果点击的是按钮，不触发
            if (e.target.tagName === 'BUTTON') return;
            
            const nodeData = JSON.parse(this.dataset.node.replace(/&#39;/g, "'"));
            addNodeToCanvas(nodeData);
        });
        
        // 拖拽开始
        item.addEventListener('dragstart', function(e) {
            const nodeData = JSON.parse(this.dataset.node.replace(/&#39;/g, "'"));
            e.dataTransfer.setData('application/json', JSON.stringify(nodeData));
            e.dataTransfer.effectAllowed = 'copy';
            this.style.opacity = '0.5';
        });
        
        // 拖拽结束
        item.addEventListener('dragend', function(e) {
            this.style.opacity = '1';
        });
    });
    
    // 绑定重命名按钮
    content.querySelectorAll('.rename-fav-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            const currentTitle = this.dataset.title;
            const newTitle = prompt('请输入新名称:', currentTitle);
            
            if (newTitle !== null && newTitle.trim() !== '' && newTitle !== currentTitle) {
                await renameFavorite(id, newTitle.trim());
            }
        });
    });
    
    // 绑定删除按钮
    content.querySelectorAll('.delete-fav-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            if (confirm('确定要删除这个收藏吗?')) {
                await deleteFavorite(id);
            }
        });
    });
    
    // 更新状态栏
    let statusText = '';
    if (searchKeyword) {
        statusText = `搜索: "${searchKeyword}" | `;
    }
    statusText += `共 ${favorites.length} 个收藏`;
    if (currentCategory !== '全部') {
        statusText += ` (${currentCategory})`;
    }
    statusBar.textContent = statusText;
}

// 重命名收藏
async function renameFavorite(id, newTitle) {
    try {
        const response = await fetch('/pigsavenode/api/favorites/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, title: newTitle })
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadFavorites();
            showNotification('✅ 重命名成功', 'success');
        } else {
            showNotification('❌ 重命名失败', 'error');
        }
    } catch (error) {
        console.error('[PIGsavenode] 重命名失败:', error);
        showNotification('❌ 重命名失败', 'error');
    }
}

// 删除收藏
async function deleteFavorite(id) {
    try {
        const response = await fetch(`/pigsavenode/api/favorites?id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadFavorites();
            showNotification('✅ 删除成功', 'success');
        }
    } catch (error) {
        console.error('[PIGsavenode] 删除失败:', error);
        showNotification('❌ 删除失败', 'error');
    }
}

// 添加分类
async function addCategory() {
    const name = prompt('请输入新分类名称:');
    if (!name || !name.trim()) return;
    
    try {
        const response = await fetch('/pigsavenode/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim() })
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadFavorites();
            showNotification('✅ 分类创建成功', 'success');
        }
    } catch (error) {
        console.error('[PIGsavenode] 创建分类失败:', error);
        showNotification('❌ 创建失败', 'error');
    }
}

// 删除分类
async function deleteCategory() {
    if (currentCategory === '全部') {
        showNotification('⚠️ 请先选择要删除的分类', 'warning');
        return;
    }
    
    if (currentCategory === '默认分类') {
        showNotification('❌ 默认分类不能删除', 'error');
        return;
    }
    
    const confirmDelete = confirm(`确定要删除分类"${currentCategory}"吗？\n该分类下的所有收藏将移动到"默认分类"`);
    if (!confirmDelete) return;
    
    try {
        const response = await fetch(`/pigsavenode/api/categories?name=${encodeURIComponent(currentCategory)}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentCategory = '全部';
            await loadFavorites();
            showNotification('✅ 分类删除成功', 'success');
        } else {
            showNotification('❌ 删除失败: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('[PIGsavenode] 删除分类失败:', error);
        showNotification('❌ 删除失败', 'error');
    }
}

// 添加节点到画布
function addNodeToCanvas(nodeData) {
    
    const app = getComfyApp();
    if (!app || !app.graph) {
        showNotification('❌ ComfyUI未就绪', 'error');
        return;
    }
    
    try {
        // 如果是节点组，使用不同的恢复逻辑
        if (nodeData.isGroup && nodeData.nodes && nodeData.nodes.length > 0) {
            addNodeGroupToCanvas(nodeData);
            return;
        }
        
        // 单个节点的恢复逻辑
        // 获取画布中心位置
        const canvas = app.canvas;
        const canvasCenter = canvas.ds.visible_area;
        
        // 计算节点放置位置（画布中心）
        const x = (canvasCenter[0] + canvasCenter[2]) / 2;
        const y = (canvasCenter[1] + canvasCenter[3]) / 2;
        
        // 创建节点
        const node = LiteGraph.createNode(nodeData.type);
        
        if (!node) {
            showNotification(`❌ 无法创建节点: ${nodeData.type}`, 'error');
            return;
        }
        
        // 设置节点位置
        node.pos = [x - 100, y - 50]; // 稍微偏移使其居中
        
        // 如果有保存的尺寸，恢复它
        if (nodeData.size) {
            node.size = nodeData.size;
        }
        
        // 恢复widget值
        if (nodeData.widgets && node.widgets) {
            nodeData.widgets.forEach((savedWidget, index) => {
                if (node.widgets[index] && savedWidget.value !== undefined) {
                    node.widgets[index].value = savedWidget.value;
                }
            });
        }
        
        // 添加到图形
        app.graph.add(node);
        
        // 选中新创建的节点
        canvas.selectNode(node);
        
        // 居中显示节点
        canvas.centerOnNode(node);
        
        showNotification(`✅ 已添加节点: ${nodeData.title}`, 'success');
        
        
    } catch (error) {
        console.error('[PIGsavenode] 添加节点失败:', error);
        showNotification('❌ 添加节点失败', 'error');
    }
}

// 添加节点组到画布
function addNodeGroupToCanvas(groupData) {
    const app = getComfyApp();
    if (!app || !app.graph || !app.canvas) {
        showNotification('❌ ComfyUI未就绪', 'error');
        return;
    }
    
    try {
        const canvas = app.canvas;
        const canvasCenter = canvas.ds.visible_area;
        
        // 计算节点组放置位置（画布中心）
        const centerX = (canvasCenter[0] + canvasCenter[2]) / 2;
        const centerY = (canvasCenter[1] + canvasCenter[3]) / 2;
        
        // 计算节点组的边界框
        let minX = Infinity, minY = Infinity;
        groupData.nodes.forEach(nd => {
            const relPos = nd.relativePos || nd.pos || [0, 0];
            if (relPos[0] < minX) minX = relPos[0];
            if (relPos[1] < minY) minY = relPos[1];
        });
        
        // 创建所有节点
        const createdNodes = [];
        groupData.nodes.forEach((nodeData, index) => {
            const node = LiteGraph.createNode(nodeData.type);
            
            if (!node) {
                console.error(`[PIGsavenode] 无法创建节点: ${nodeData.type}`);
                return;
            }
            
            // 计算节点位置（相对于组中心）
            const relPos = nodeData.relativePos || nodeData.pos || [0, 0];
            const offsetX = relPos[0] - minX;
            const offsetY = relPos[1] - minY;
            
            node.pos = [centerX + offsetX - 200, centerY + offsetY - 100];
            
            // 恢复尺寸
            if (nodeData.size) {
                node.size = nodeData.size;
            }
            
            // 恢复widget值
            if (nodeData.widgets && node.widgets) {
                nodeData.widgets.forEach((savedWidget, widgetIndex) => {
                    if (node.widgets[widgetIndex] && savedWidget.value !== undefined) {
                        node.widgets[widgetIndex].value = savedWidget.value;
                    }
                });
            }
            
            // 恢复属性
            if (nodeData.properties) {
                Object.assign(node.properties || {}, nodeData.properties);
            }
            
            // 添加到图形
            app.graph.add(node);
            createdNodes.push(node);
        });
        
        // 重建连接
        if (groupData.connections && createdNodes.length > 0) {
            groupData.connections.forEach(conn => {
                const fromNode = createdNodes[conn.from_node_index];
                const toNode = createdNodes[conn.to_node_index];
                
                if (fromNode && toNode && 
                    fromNode.outputs && fromNode.outputs[conn.from_slot] &&
                    toNode.inputs && toNode.inputs[conn.to_slot]) {
                    
                    // 创建连接
                    fromNode.connect(conn.from_slot, toNode, conn.to_slot);
                }
            });
        }
        
        // 选中所有创建的节点
        canvas.selectNode(createdNodes[0]);
        createdNodes.forEach(node => {
            canvas.selectNode(node, true); // true表示添加到选择
        });
        
        // 居中显示节点组
        if (createdNodes.length > 0) {
            canvas.centerOnNode(createdNodes[0]);
        }
        
        showNotification(`✅ 已添加节点组: ${groupData.title} (${createdNodes.length}个节点)`, 'success');
        
    } catch (error) {
        console.error('[PIGsavenode] 添加节点组失败:', error);
        showNotification('❌ 添加节点组失败', 'error');
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2a2a2a;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 10003;
        border-left: 4px solid ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
    @keyframes slideOut {
        from { transform: translateX(0); }
        to { transform: translateX(100%); }
    }
`;
document.head.appendChild(style);

// 获取当前选中的节点
function getSelectedNodes() {
    const app = getComfyApp();
    if (!app || !app.canvas) {
        return [];
    }
    
    const selected = app.canvas.selected_nodes || {};
    const nodes = [];
    
    for (let nodeId in selected) {
        const node = app.graph.getNodeById(parseInt(nodeId));
        if (node) {
            nodes.push(node);
        }
    }
    
    return nodes;
}

// 获取节点之间的连接关系
function getNodeConnections(nodes) {
    const app = getComfyApp();
    if (!app || !app.graph) {
        return [];
    }
    
    const connections = [];
    const nodeIds = new Set(nodes.map(n => n.id));
    
    nodes.forEach(node => {
        // 获取节点的输出连接
        if (node.outputs) {
            node.outputs.forEach((output, outputIndex) => {
                if (output.links) {
                    output.links.forEach(linkId => {
                        const link = app.graph.links[linkId];
                        if (link && nodeIds.has(link.target_id)) {
                            // 这是一个内部连接
                            connections.push({
                                from_node_id: node.id,
                                from_slot: outputIndex,
                                to_node_id: link.target_id,
                                to_slot: link.target_slot
                            });
                        }
                    });
                }
            });
        }
    });
    
    return connections;
}

// 收藏选中的节点
async function saveSelectedNodes() {
    const nodes = getSelectedNodes();
    
    if (nodes.length === 0) {
        showNotification('⚠️ 请先选中要收藏的节点', 'warning');
        return;
    }
    
    try {
        // 如果只有一个节点，按原来的方式保存（单个节点）
        if (nodes.length === 1) {
            const node = nodes[0];
            
            // 获取节点的实际显示名称
            let displayTitle = node.title;
            
            // 如果没有title，尝试从ComfyUI的节点定义获取
            if (!displayTitle && window.LiteGraph && window.LiteGraph.registered_node_types) {
                const nodeClass = window.LiteGraph.registered_node_types[node.type];
                if (nodeClass && nodeClass.title) {
                    displayTitle = nodeClass.title;
                }
            }
            
            // 如果还是没有，尝试其他属性
            if (!displayTitle) {
                displayTitle = node.properties?.title || 
                             node.properties?.["Node name for S&R"] ||
                             node.name ||
                             node.comfyClass ||
                             node.type;
            }
            
            const nodeData = {
                type: node.type,
                title: displayTitle,
                description: displayTitle !== node.type ? `${node.type}` : `${node.type} 节点`,
                properties: node.properties || {},
                size: node.size,
                widgets: node.widgets ? node.widgets.map(w => ({
                    name: w.name,
                    type: w.type,
                    value: w.value
                })) : []
            };
            
            const response = await fetch('/pigsavenode/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    node: nodeData,
                    category: currentCategory === '全部' ? '默认分类' : currentCategory
                })
            });
            
            const result = await response.json();
            if (result.success) {
                await loadFavorites();
                showNotification(`✅ 成功收藏节点!`, 'success');
            } else {
                showNotification('❌ 收藏失败', 'error');
            }
        } else {
            // 多个节点，保存为节点组
            const app = getComfyApp();
            if (!app || !app.graph) {
                showNotification('❌ ComfyUI未就绪', 'error');
                return;
            }
            
            // 获取节点之间的连接关系
            const connections = getNodeConnections(nodes);
            
            // 保存所有节点的数据
            const nodesData = nodes.map(node => {
                // 获取节点的实际显示名称
                let displayTitle = node.title;
                
                if (!displayTitle && window.LiteGraph && window.LiteGraph.registered_node_types) {
                    const nodeClass = window.LiteGraph.registered_node_types[node.type];
                    if (nodeClass && nodeClass.title) {
                        displayTitle = nodeClass.title;
                    }
                }
                
                if (!displayTitle) {
                    displayTitle = node.properties?.title || 
                                 node.properties?.["Node name for S&R"] ||
                                 node.name ||
                                 node.comfyClass ||
                                 node.type;
                }
                
                return {
                    id: node.id, // 保存原始ID用于连接关系
                    type: node.type,
                    title: displayTitle,
                    description: displayTitle !== node.type ? `${node.type}` : `${node.type} 节点`,
                    properties: node.properties || {},
                    size: node.size,
                    pos: node.pos ? [node.pos[0], node.pos[1]] : [0, 0], // 保存位置
                    widgets: node.widgets ? node.widgets.map(w => ({
                        name: w.name,
                        type: w.type,
                        value: w.value
                    })) : []
                };
            });
            
            // 计算节点组的边界框，用于计算相对位置
            let minX = Infinity, minY = Infinity;
            nodesData.forEach(nd => {
                if (nd.pos[0] < minX) minX = nd.pos[0];
                if (nd.pos[1] < minY) minY = nd.pos[1];
            });
            
            // 转换为相对位置（相对于左上角）
            nodesData.forEach(nd => {
                nd.relativePos = [nd.pos[0] - minX, nd.pos[1] - minY];
            });
            
            // 创建节点组数据
            const groupTitle = prompt(`收藏节点组 (${nodes.length}个节点)\n\n请输入节点组名称:`, `节点组 (${nodes.length}个节点)`);
            if (groupTitle === null) {
                return; // 用户取消
            }
            
            const groupData = {
                isGroup: true, // 标记为节点组
                title: groupTitle.trim() || `节点组 (${nodes.length}个节点)`,
                description: `包含 ${nodes.length} 个已连接的节点`,
                nodes: nodesData,
                connections: connections.map(conn => ({
                    from_node_index: nodesData.findIndex(n => n.id === conn.from_node_id),
                    from_slot: conn.from_slot,
                    to_node_index: nodesData.findIndex(n => n.id === conn.to_node_id),
                    to_slot: conn.to_slot
                })), // 使用索引而不是ID，因为恢复时会创建新节点
                nodeCount: nodes.length
            };
            
            const response = await fetch('/pigsavenode/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    node: groupData,
                    category: currentCategory === '全部' ? '默认分类' : currentCategory
                })
            });
            
            const result = await response.json();
            if (result.success) {
                await loadFavorites();
                showNotification(`✅ 成功收藏节点组 (${nodes.length}个节点)!`, 'success');
            } else {
                showNotification('❌ 收藏失败: ' + (result.error || ''), 'error');
            }
        }
    } catch (error) {
        console.error('[PIGsavenode] 保存节点失败:', error);
        showNotification('❌ 收藏失败', 'error');
    }
}

// 注册右键菜单
function registerContextMenu() {
    const app = getComfyApp();
    if (!app || !app.canvas) {
        setTimeout(registerContextMenu, 1000);
        return;
    }
    
    // 保存原始的getNodeMenuOptions
    const origGetNodeMenuOptions = app.canvas.getNodeMenuOptions;
    
    app.canvas.getNodeMenuOptions = function(node) {
        const options = origGetNodeMenuOptions ? origGetNodeMenuOptions.apply(this, arguments) : [];
        
        // 添加收藏选项
        options.push({
            content: "🐷 收藏到PIGsavenode",
            callback: async () => {
                // 获取节点顶部实际显示的标题
                let displayTitle = null;
                
                // 方法1: 尝试从节点的 title 属性获取（如果不等于type）
                if (node.title && node.title !== node.type) {
                    displayTitle = node.title;
                }
                
                // 方法2: 尝试从 ComfyUI 的节点定义获取翻译后的标题
                if (!displayTitle && window.LiteGraph && window.LiteGraph.registered_node_types) {
                    const nodeClass = window.LiteGraph.registered_node_types[node.type];
                    if (nodeClass) {
                        // 尝试获取 title_mode 或其他可能的标题属性
                        displayTitle = nodeClass.title || nodeClass.name;
                    }
                }
                
                // 方法3: 尝试从 ComfyUI app 的节点定义获取
                if (!displayTitle && window.app && window.app.graph) {
                    // 尝试从 ComfyUI 的内部数据结构获取
                    const nodeData = window.app.graph._nodes_by_id?.[node.id];
                    if (nodeData && nodeData.title && nodeData.title !== nodeData.type) {
                        displayTitle = nodeData.title;
                    }
                }
                
                // 方法4: 尝试直接读取节点DOM元素的文本（最可靠的方法）
                try {
                    // 查找节点对应的DOM元素
                    const canvas = document.querySelector('canvas.graph-canvas');
                    if (canvas && node.id) {
                        // 这个方法可能需要根据实际的DOM结构调整
                        // 但通常节点的标题会渲染在canvas上，我们需要从LiteGraph获取
                    }
                } catch (e) {
                }
                
                // 最后的备选方案：使用节点类型
                if (!displayTitle) {
                    displayTitle = node.properties?.["Node name for S&R"] || 
                                 node.name ||
                                 node.type;
                }
                
                // 询问用户是否要自定义名称
                const customName = prompt(`收藏节点: ${displayTitle}\n\n如需自定义名称，请输入（留空使用默认名称）:`, displayTitle);
                
                // 如果用户点击取消，则不收藏
                if (customName === null) {
                    return;
                }
                
                // 使用用户输入的名称，如果为空则使用默认名称
                const finalTitle = customName.trim() || displayTitle;
                
                const nodeData = {
                    type: node.type,
                    title: finalTitle,
                    description: `${node.type}`,
                    properties: node.properties || {},
                    size: node.size,
                    widgets: node.widgets ? node.widgets.map(w => ({
                        name: w.name,
                        type: w.type,
                        value: w.value
                    })) : []
                };
                
                try {
                    const response = await fetch('/pigsavenode/api/favorites', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            node: nodeData,
                            category: currentCategory === '全部' ? '默认分类' : currentCategory
                        })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        showNotification('✅ 节点收藏成功!', 'success');
                        loadFavorites();
                    } else {
                        showNotification('❌ 收藏失败: ' + result.error, 'error');
                    }
                } catch (error) {
                    console.error('[PIGsavenode] 保存失败:', error);
                    showNotification('❌ 收藏失败', 'error');
                }
            }
        });
        
        return options;
    };
    
}

// 注册画布拖放监听
function registerCanvasDrop() {
    const app = getComfyApp();
    if (!app || !app.canvas || !app.canvas.canvas) {
        setTimeout(registerCanvasDrop, 1000);
        return;
    }
    
    const canvas = app.canvas.canvas;
    
    // 监听拖放事件
    canvas.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    
    canvas.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const data = e.dataTransfer.getData('application/json');
            if (data) {
                const nodeData = JSON.parse(data);
                
                // 如果是节点组，使用节点组的恢复逻辑
                if (nodeData.isGroup && nodeData.nodes && nodeData.nodes.length > 0) {
                    // 获取鼠标在画布上的位置
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // 转换为画布坐标
                    const canvasX = (x / app.canvas.ds.scale) - app.canvas.ds.offset[0];
                    const canvasY = (y / app.canvas.ds.scale) - app.canvas.ds.offset[1];
                    
                    // 计算节点组的边界框
                    let minX = Infinity, minY = Infinity;
                    nodeData.nodes.forEach(nd => {
                        const relPos = nd.relativePos || nd.pos || [0, 0];
                        if (relPos[0] < minX) minX = relPos[0];
                        if (relPos[1] < minY) minY = relPos[1];
                    });
                    
                    // 创建所有节点
                    const createdNodes = [];
                    nodeData.nodes.forEach((nd, index) => {
                        const node = LiteGraph.createNode(nd.type);
                        
                        if (!node) {
                            console.error(`[PIGsavenode] 无法创建节点: ${nd.type}`);
                            return;
                        }
                        
                        // 计算节点位置（相对于拖放位置）
                        const relPos = nd.relativePos || nd.pos || [0, 0];
                        const offsetX = relPos[0] - minX;
                        const offsetY = relPos[1] - minY;
                        
                        node.pos = [canvasX + offsetX, canvasY + offsetY];
                        
                        // 恢复尺寸
                        if (nd.size) {
                            node.size = nd.size;
                        }
                        
                        // 恢复widget值
                        if (nd.widgets && node.widgets) {
                            nd.widgets.forEach((savedWidget, widgetIndex) => {
                                if (node.widgets[widgetIndex] && savedWidget.value !== undefined) {
                                    node.widgets[widgetIndex].value = savedWidget.value;
                                }
                            });
                        }
                        
                        // 恢复属性
                        if (nd.properties) {
                            Object.assign(node.properties || {}, nd.properties);
                        }
                        
                        // 添加到图形
                        app.graph.add(node);
                        createdNodes.push(node);
                    });
                    
                    // 重建连接
                    if (nodeData.connections && createdNodes.length > 0) {
                        nodeData.connections.forEach(conn => {
                            const fromNode = createdNodes[conn.from_node_index];
                            const toNode = createdNodes[conn.to_node_index];
                            
                            if (fromNode && toNode && 
                                fromNode.outputs && fromNode.outputs[conn.from_slot] &&
                                toNode.inputs && toNode.inputs[conn.to_slot]) {
                                
                                // 创建连接
                                fromNode.connect(conn.from_slot, toNode, conn.to_slot);
                            }
                        });
                    }
                    
                    showNotification(`✅ 已添加节点组: ${nodeData.title} (${createdNodes.length}个节点)`, 'success');
                    return;
                }
                
                // 单个节点的恢复逻辑
                // 获取鼠标在画布上的位置
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // 转换为画布坐标
                const canvasX = (x / app.canvas.ds.scale) - app.canvas.ds.offset[0];
                const canvasY = (y / app.canvas.ds.scale) - app.canvas.ds.offset[1];
                
                // 创建节点
                const node = LiteGraph.createNode(nodeData.type);
                
                if (node) {
                    // 设置节点位置为拖放位置
                    node.pos = [canvasX, canvasY];
                    
                    // 恢复尺寸和widget值
                    if (nodeData.size) {
                        node.size = nodeData.size;
                    }
                    
                    if (nodeData.widgets && node.widgets) {
                        nodeData.widgets.forEach((savedWidget, index) => {
                            if (node.widgets[index] && savedWidget.value !== undefined) {
                                node.widgets[index].value = savedWidget.value;
                            }
                        });
                    }
                    
                    // 添加到图形
                    app.graph.add(node);
                    
                    showNotification(`✅ 已添加节点: ${nodeData.title}`, 'success');
                } else {
                    showNotification(`❌ 无法创建节点: ${nodeData.type}`, 'error');
                }
            }
        } catch (error) {
            console.error('[PIGsavenode] 拖放失败:', error);
        }
    });
    
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            createButton();
            registerContextMenu();
            registerCanvasDrop();
        }, 1000);
    });
} else {
    setTimeout(() => {
        createButton();
        registerContextMenu();
        registerCanvasDrop();
    }, 1000);
}

