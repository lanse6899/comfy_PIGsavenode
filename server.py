# -*- coding: utf-8 -*-
"""
PIGsavenode服务器路由模块
"""
from pathlib import Path
from aiohttp import web
import json
import time

class PIGServer:
    """PIGsavenode服务器"""
    
    def __init__(self):
        self.data_file = Path(__file__).parent / 'favorites.json'
        self.ensure_data_file()
    
    def ensure_data_file(self):
        """确保数据文件存在"""
        if not self.data_file.exists():
            default_data = {
                'categories': ['默认分类', '常用节点', '图像处理', '文本处理'],
                'favorites': []
            }
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(default_data, f, ensure_ascii=False, indent=2)
    
    def load_data(self):
        """加载数据"""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"[PIGsavenode] 加载数据失败: {e}")
            return {'categories': ['默认分类'], 'favorites': []}
    
    def save_data(self, data):
        """保存数据"""
        try:
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"[PIGsavenode] 保存数据失败: {e}")
            return False
    
    async def get_favorites(self, request):
        """获取收藏列表"""
        try:
            data = self.load_data()
            return web.json_response({
                'success': True,
                'data': data
            })
        except Exception as e:
            return web.json_response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    async def add_favorite(self, request):
        """添加收藏"""
        try:
            body = await request.json()
            node_data = body.get('node')
            category = body.get('category', '默认分类')
            
            if not node_data:
                return web.json_response({
                    'success': False,
                    'error': '缺少节点数据'
                }, status=400)
            
            data = self.load_data()
            
            # 添加时间戳和ID
            node_data['id'] = str(int(time.time() * 1000))
            node_data['category'] = category
            node_data['created_at'] = time.time()
            
            data['favorites'].append(node_data)
            
            if self.save_data(data):
                return web.json_response({
                    'success': True,
                    'data': node_data
                })
            else:
                return web.json_response({
                    'success': False,
                    'error': '保存失败'
                }, status=500)
                
        except Exception as e:
            print(f"[PIGsavenode] 添加收藏失败: {e}")
            return web.json_response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    async def delete_favorite(self, request):
        """删除收藏"""
        try:
            node_id = request.query.get('id')
            
            if not node_id:
                return web.json_response({
                    'success': False,
                    'error': '缺少节点ID'
                }, status=400)
            
            data = self.load_data()
            data['favorites'] = [f for f in data['favorites'] if f.get('id') != node_id]
            
            if self.save_data(data):
                return web.json_response({
                    'success': True
                })
            else:
                return web.json_response({
                    'success': False,
                    'error': '保存失败'
                }, status=500)
                
        except Exception as e:
            return web.json_response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    async def get_categories(self, request):
        """获取分类列表"""
        try:
            data = self.load_data()
            return web.json_response({
                'success': True,
                'data': data.get('categories', ['默认分类'])
            })
        except Exception as e:
            return web.json_response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    async def add_category(self, request):
        """添加分类"""
        try:
            body = await request.json()
            category_name = body.get('name')
            
            if not category_name:
                return web.json_response({
                    'success': False,
                    'error': '缺少分类名称'
                }, status=400)
            
            data = self.load_data()
            
            if category_name not in data['categories']:
                data['categories'].append(category_name)
                
                if self.save_data(data):
                    return web.json_response({
                        'success': True,
                        'data': data['categories']
                    })
            
            return web.json_response({
                'success': True,
                'data': data['categories']
            })
                
        except Exception as e:
            return web.json_response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    async def rename_favorite(self, request):
        """重命名收藏"""
        try:
            body = await request.json()
            node_id = body.get('id')
            new_title = body.get('title')
            
            if not node_id or not new_title:
                return web.json_response({
                    'success': False,
                    'error': '缺少参数'
                }, status=400)
            
            data = self.load_data()
            
            # 查找并更新节点标题
            for fav in data['favorites']:
                if fav.get('id') == node_id:
                    fav['title'] = new_title
                    break
            
            if self.save_data(data):
                return web.json_response({
                    'success': True
                })
            else:
                return web.json_response({
                    'success': False,
                    'error': '保存失败'
                }, status=500)
                
        except Exception as e:
            return web.json_response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    async def delete_category(self, request):
        """删除分类"""
        try:
            category_name = request.query.get('name', '').strip()
            
            if not category_name:
                return web.json_response({
                    'success': False,
                    'error': '分类名称不能为空'
                }, status=400)
            
            if category_name == '默认分类':
                return web.json_response({
                    'success': False,
                    'error': '默认分类不能删除'
                }, status=400)
            
            data = self.load_data()
            
            if category_name in data['categories']:
                # 删除分类
                data['categories'].remove(category_name)
                
                # 将该分类下的所有收藏移动到默认分类
                for fav in data['favorites']:
                    if fav.get('category') == category_name:
                        fav['category'] = '默认分类'
                
                if self.save_data(data):
                    return web.json_response({
                        'success': True
                    })
                else:
                    return web.json_response({
                        'success': False,
                        'error': '保存失败'
                    }, status=500)
            
            return web.json_response({
                'success': False,
                'error': '分类不存在'
            }, status=404)
                
        except Exception as e:
            return web.json_response({
                'success': False,
                'error': str(e)
            }, status=500)

# 创建全局实例
pig_server = PIGServer()

def add_routes(routes):
    """添加路由（备用方式）"""
    pass
