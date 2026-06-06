import { useState, useEffect } from 'react';
import axios from 'axios';

function Members() {
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    allergens: '',
    restrictions: ''
  });

  const commonAllergens = ['花生', '牛奶', '鸡蛋', '海鲜', '小麦', '大豆', '坚果'];
  const commonRestrictions = ['素食', '低脂', '低盐', '低糖', '清真', '无麸质'];

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await axios.get('/api/members');
      setMembers(response.data);
    } catch (err) {
      console.error('获取家庭成员失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const allergensArray = formData.allergens
      .split(/[,，、]/)
      .map(a => a.trim())
      .filter(a => a);
    
    const restrictionsArray = formData.restrictions
      .split(/[,，、]/)
      .map(r => r.trim())
      .filter(r => r);

    const data = {
      ...formData,
      age: formData.age ? parseInt(formData.age) : null,
      allergens: allergensArray,
      restrictions: restrictionsArray
    };

    try {
      if (editingMember) {
        await axios.put(`/api/members/${editingMember.id}`, data);
      } else {
        await axios.post('/api/members', data);
      }
      fetchMembers();
      closeModal();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      age: member.age || '',
      gender: member.gender || '',
      allergens: member.allergens?.join('、') || '',
      restrictions: member.restrictions?.join('、') || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除这位家庭成员吗？')) {
      try {
        await axios.delete(`/api/members/${id}`);
        fetchMembers();
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setFormData({
      name: '',
      age: '',
      gender: '',
      allergens: '',
      restrictions: ''
    });
  };

  const addAllergen = (allergen) => {
    const current = formData.allergens
      .split(/[,，、]/)
      .map(a => a.trim())
      .filter(a => a);
    
    if (!current.includes(allergen)) {
      current.push(allergen);
      setFormData({ ...formData, allergens: current.join('、') });
    }
  };

  const addRestriction = (restriction) => {
    const current = formData.restrictions
      .split(/[,，、]/)
      .map(r => r.trim())
      .filter(r => r);
    
    if (!current.includes(restriction)) {
      current.push(restriction);
      setFormData({ ...formData, restrictions: current.join('、') });
    }
  };

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">家庭成员管理</h1>
          <p className="text-gray-500 mt-1">管理家庭成员信息，设置过敏源和饮食忌口</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          + 添加成员
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div key={member.id} className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                  {member.gender === '男' ? '👨' : member.gender === '女' ? '👩' : '👤'}
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-500">
                    {member.age ? `${member.age}岁` : ''} {member.gender || ''}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(member)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {member.diet_tags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {member.allergens?.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">过敏源:</p>
                <div className="flex flex-wrap gap-1">
                  {member.allergens.map((allergen, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {member.restrictions?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">饮食忌口:</p>
                <div className="flex flex-wrap gap-1">
                  {member.restrictions.map((restriction, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full"
                    >
                      {restriction}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {members.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">👨‍👩‍👧‍👦</p>
            <p>还没有添加家庭成员</p>
            <p className="text-sm">点击上方按钮添加第一位家庭成员</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingMember ? '编辑成员' : '添加家庭成员'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    年龄
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    性别
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  过敏源（用顿号分隔）
                </label>
                <input
                  type="text"
                  value={formData.allergens}
                  onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                  placeholder="如：花生、牛奶、鸡蛋"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {commonAllergens.map((allergen) => (
                    <button
                      key={allergen}
                      type="button"
                      onClick={() => addAllergen(allergen)}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200"
                    >
                      + {allergen}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  饮食忌口（用顿号分隔）
                </label>
                <input
                  type="text"
                  value={formData.restrictions}
                  onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
                  placeholder="如：素食、低脂、低盐"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {commonRestrictions.map((restriction) => (
                    <button
                      key={restriction}
                      type="button"
                      onClick={() => addRestriction(restriction)}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200"
                    >
                      + {restriction}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingMember ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Members;
