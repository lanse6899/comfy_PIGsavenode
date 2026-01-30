# -*- coding: utf-8 -*-
"""
PIGsavenode - ComfyUI节点收藏插件
可以通过拖拽将节点收藏到浏览器中
"""

from .nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
from .server import add_routes

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']

# Web目录
WEB_DIRECTORY = "./web"

# 版本信息
__version__ = "1.0.0"
__author__ = "PIG Team"
__description__ = "PIGsavenode - ComfyUI节点收藏插件"

print(f"[PIGsavenode] v{__version__} - {__description__}")
print(f"[PIGsavenode] 正在加载插件...")

# ComfyUI路由注册
try:
    from server import PromptServer
    
    @PromptServer.instance.routes.get('/pigsavenode/api/favorites')
    async def get_favorites_route(request):
        from .server import pig_server
        return await pig_server.get_favorites(request)
    
    @PromptServer.instance.routes.post('/pigsavenode/api/favorites')
    async def add_favorite_route(request):
        from .server import pig_server
        return await pig_server.add_favorite(request)
    
    @PromptServer.instance.routes.delete('/pigsavenode/api/favorites')
    async def delete_favorite_route(request):
        from .server import pig_server
        return await pig_server.delete_favorite(request)
    
    @PromptServer.instance.routes.get('/pigsavenode/api/categories')
    async def get_categories_route(request):
        from .server import pig_server
        return await pig_server.get_categories(request)
    
    @PromptServer.instance.routes.post('/pigsavenode/api/categories')
    async def add_category_route(request):
        from .server import pig_server
        return await pig_server.add_category(request)
    
    @PromptServer.instance.routes.post('/pigsavenode/api/favorites/rename')
    async def rename_favorite_route(request):
        from .server import pig_server
        return await pig_server.rename_favorite(request)
    
    @PromptServer.instance.routes.delete('/pigsavenode/api/categories')
    async def delete_category_route(request):
        from .server import pig_server
        return await pig_server.delete_category(request)
    
    print("[PIGsavenode] 路由注册成功")
except Exception as e:
    print(f"[PIGsavenode] 路由注册失败: {e}")
    
    # 备用方式
    def setup_routes(routes):
        """为ComfyUI设置路由"""
        try:
            add_routes(routes)
            print("[PIGsavenode] 路由注册成功（备用方式）")
        except Exception as e:
            print(f"[PIGsavenode] 路由注册失败: {e}")
    
    __all__.append('setup_routes')
