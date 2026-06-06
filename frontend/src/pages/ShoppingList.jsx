import { useState, useEffect } from 'react';
import axios from 'axios';

function ShoppingList() {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showListModal, setShowListModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit: '' });

  const commonUnits = ['g', 'kg', 'ml', 'L', '个', '斤', '把', '袋', '瓶', '盒'];

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await axios.get('/api/shopping/lists');
      setLists(response.data);
      if (response.data.length > 0 && !selectedList) {
        setSelectedList(response.data[0]);
        fetchItems(response.data[0].id);
      }
    } catch (err) {
      console.error('获取购物清单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (listId) => {
    try {
      const response = await axios.get(`/api/shopping/lists/${listId}/items`);
      setItems(response.data);
    } catch (err) {
      console.error('获取购物清单项目失败:', err);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/shopping/lists', { name: newListName });
      fetchLists();
      setNewListName('');
      setShowListModal(false);
    } catch (err) {
      alert('创建失败');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedList) return;
    
    try {
      await axios.post(`/api/shopping/lists/${selectedList.id}/items`, newItem);
      fetchItems(selectedList.id);
      setNewItem({ name: '', quantity: 1, unit: '' });
      setShowItemModal(false);
    } catch (err) {
      alert('添加失败');
    }
  };

  const toggleItem = async (item) => {
    try {
      await axios.put(`/api/shopping/items/${item.id}`, {
        ...item,
        is_purchased: !item.is_purchased
      });
      fetchItems(selectedList.id);
    } catch (err) {
      console.error('更新失败:', err);
    }
  };

  const deleteItem = async (itemId) => {
    if (confirm('确定要删除这个项目吗？')) {
      try {
        await axios.delete(`/api/shopping/items/${itemId}`);
        fetchItems(selectedList.id);
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  const deleteList = async (listId) => {
    if (confirm('确定要删除这个购物清单吗？')) {
      try {
        await axios.delete(`/api/shopping/lists/${listId}`);
        setSelectedList(null);
        setItems([]);
        fetchLists();
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  const purchasedItems = items.filter(i => i.is_purchased);
  const unpurchasedItems = items.filter(i => !i.is_purchased);

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">购物清单</h1>
          <p className="text-gray-500 mt-1">管理您的购物清单，勾选已购买的物品</p>
        </div>
        <button
          onClick={() => setShowListModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          + 新建清单
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-4">我的清单</h2>
            <div className="space-y-2">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedList?.id === list.id
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    setSelectedList(list);
                    fetchItems(list.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{list.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteList(list.id);
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      🗑️
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(list.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {lists.length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  暂无购物清单
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedList ? (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedList.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    已购买 {purchasedItems.length} / {items.length} 项
                  </p>
                </div>
                <button
                  onClick={() => setShowItemModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  + 添加物品
                </button>
              </div>

              <div className="p-4">
                {unpurchasedItems.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">待购买</h3>
                    <div className="space-y-2">
                      {unpurchasedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          <label className="flex items-center flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.is_purchased}
                              onChange={() => toggleItem(item)}
                              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="ml-3 font-medium text-gray-900">
                              {item.name}
                            </span>
                          </label>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-500">
                              {item.quantity} {item.unit}
                            </span>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {purchasedItems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">已购买</h3>
                    <div className="space-y-2">
                      {purchasedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                        >
                          <label className="flex items-center flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.is_purchased}
                              onChange={() => toggleItem(item)}
                              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="ml-3 text-gray-400 line-through">
                              {item.name}
                            </span>
                          </label>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-400">
                              {item.quantity} {item.unit}
                            </span>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {items.length === 0 && (
                  <div className="text-center text-gray-400 py-12">
                    <p className="text-4xl mb-2">🛒</p>
                    <p>购物清单是空的</p>
                    <p className="text-sm">点击上方按钮添加物品</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
              <p className="text-4xl mb-2">🛒</p>
              <p>请选择或创建一个购物清单</p>
            </div>
          )}
        </div>
      </div>

      {showListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">新建购物清单</h2>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  清单名称
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="如：下周采购清单"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowListModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">添加物品</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  物品名称
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="如：西红柿"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    数量
                  </label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 1 })}
                    min="0.1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    单位
                  </label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">选择单位</option>
                    {commonUnits.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShoppingList;
