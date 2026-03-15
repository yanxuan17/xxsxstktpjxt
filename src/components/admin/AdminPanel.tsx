import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Check, X, UserCheck, UserX, Clock } from 'lucide-react';

export function AdminPanel() {
  const { pendingTeachers, allTeachers, approveTeacher, rejectTeacher, disableTeacher, enableTeacher } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'disabled' | 'all'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // 强制刷新组件
  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 格式化班级显示
  const formatClasses = (classes: any[]) => {
    if (!classes || classes.length === 0) return '未设置班级';
    return classes.map(c => c.fullName).join('、');
  };

  // 处理启用
  const handleEnable = async (teacherId: string) => {
    console.log('点击启用按钮, teacherId:', teacherId);
    const result = enableTeacher(teacherId);
    if (result) {
      forceRefresh();
    }
  };

  // 处理禁用
  const handleDisable = async (teacherId: string) => {
    console.log('点击禁用按钮, teacherId:', teacherId);
    const result = disableTeacher(teacherId);
    if (result) {
      forceRefresh();
    }
  };

  // 处理通过
  const handleApprove = async (teacherId: string) => {
    console.log('点击通过按钮, teacherId:', teacherId);
    const result = approveTeacher(teacherId);
    if (result) {
      forceRefresh();
    }
  };

  // 处理拒绝
  const handleReject = async (teacherId: string) => {
    console.log('点击拒绝按钮, teacherId:', teacherId);
    const result = rejectTeacher(teacherId);
    if (result) {
      forceRefresh();
    }
  };

  // 调试：打印所有教师数据
  useEffect(() => {
    console.log('AdminPanel - 所有教师数据:', allTeachers);
    
    // 特别检查是否有禁用状态的教师
    const disabledTeachers = allTeachers.filter(t => t.role === 'teacher' && t.status === 'disabled');
    console.log('AdminPanel - 禁用状态的教师:', disabledTeachers);
    
    const activeTeachers = allTeachers.filter(t => t.role === 'teacher' && t.status === 'active');
    console.log('AdminPanel - 启用状态的教师:', activeTeachers);
    
    const pendingTeachersList = allTeachers.filter(t => t.role === 'teacher' && t.status === 'pending');
    console.log('AdminPanel - 待审核状态的教师:', pendingTeachersList);
  }, [allTeachers]);

  // 计算各状态数量
  const pendingCount = allTeachers.filter(t => t.role === 'teacher' && t.status === 'pending').length;
  const activeCount = allTeachers.filter(t => t.role === 'teacher' && t.status === 'active').length;
  const disabledCount = allTeachers.filter(t => t.role === 'teacher' && t.status === 'disabled').length;

  return (
    <div className="max-w-6xl mx-auto" key={refreshKey}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4">
          <h2 className="text-xl font-bold text-white">管理员控制台</h2>
          <p className="text-green-50 text-sm mt-1">教师审核与管理系统</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-100">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审核</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已启用</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已禁用</p>
                <p className="text-2xl font-bold text-red-600">{disabledCount}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">教师总数</p>
                <p className="text-2xl font-bold text-blue-600">
                  {allTeachers.filter(t => t.role === 'teacher').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`admin-tab ${
              activeTab === 'pending' ? 'admin-tab-active' : 'admin-tab-inactive'
            }`}
          >
            待审核 ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`admin-tab ${
              activeTab === 'active' ? 'admin-tab-active' : 'admin-tab-inactive'
            }`}
          >
            已启用 ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('disabled')}
            className={`admin-tab ${
              activeTab === 'disabled' ? 'admin-tab-active' : 'admin-tab-inactive'
            }`}
          >
            已禁用 ({disabledCount})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`admin-tab ${
              activeTab === 'all' ? 'admin-tab-active' : 'admin-tab-inactive'
            }`}
          >
            全部教师 ({allTeachers.filter(t => t.role === 'teacher').length})
          </button>
        </div>

        {/* 教师列表 */}
        <div className="p-6">
          {activeTab === 'pending' && (
            <>
              {pendingCount === 0 ? (
                <div className="empty-state">暂无待审核教师</div>
              ) : (
                <div className="space-y-4">
                  {allTeachers
                    .filter(t => t.role === 'teacher' && t.status === 'pending')
                    .map(teacher => (
                      <div key={teacher.id} className="teacher-item">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-gray-900">{teacher.name}</h3>
                              <span className="status-badge status-badge-pending">待审核</span>
                            </div>
                            <div className="info-grid">
                              <div>
                                <span className="info-label">用户名：</span>
                                <span className="info-value">{teacher.username}</span>
                              </div>
                              <div>
                                <span className="info-label">学科：</span>
                                <span className="info-value">{teacher.subject}</span>
                              </div>
                              <div>
                                <span className="info-label">任教班级：</span>
                                <span className="info-value">{formatClasses(teacher.classes)}</span>
                              </div>
                              <div className="md:col-span-3">
                                <span className="info-label">注册时间：</span>
                                <span className="info-value">{formatDate(teacher.createdAt || '')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(teacher.id!)}
                              className="btn-approve"
                            >
                              <Check className="w-4 h-4" />
                              通过
                            </button>
                            <button
                              onClick={() => handleReject(teacher.id!)}
                              className="btn-reject"
                            >
                              <X className="w-4 h-4" />
                              拒绝
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'active' && (
            <>
              {activeCount === 0 ? (
                <div className="empty-state">暂无已启用教师</div>
              ) : (
                <div className="space-y-4">
                  {allTeachers
                    .filter(t => t.role === 'teacher' && t.status === 'active')
                    .map(teacher => (
                      <div key={teacher.id} className="teacher-item">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-gray-900">{teacher.name}</h3>
                              <span className="status-badge status-badge-active">已启用</span>
                            </div>
                            <div className="info-grid">
                              <div>
                                <span className="info-label">用户名：</span>
                                <span className="info-value">{teacher.username}</span>
                              </div>
                              <div>
                                <span className="info-label">学科：</span>
                                <span className="info-value">{teacher.subject}</span>
                              </div>
                              <div>
                                <span className="info-label">任教班级：</span>
                                <span className="info-value">{formatClasses(teacher.classes)}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDisable(teacher.id!)}
                            className="btn-disable"
                          >
                            禁用
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'disabled' && (
            <>
              {disabledCount === 0 ? (
                <div className="empty-state">暂无已禁用教师</div>
              ) : (
                <div className="space-y-4">
                  {allTeachers
                    .filter(t => t.role === 'teacher' && t.status === 'disabled')
                    .map(teacher => (
                      <div key={teacher.id} className="teacher-item">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-gray-900">{teacher.name}</h3>
                              <span className="status-badge status-badge-disabled">已禁用</span>
                            </div>
                            <div className="info-grid">
                              <div>
                                <span className="info-label">用户名：</span>
                                <span className="info-value">{teacher.username}</span>
                              </div>
                              <div>
                                <span className="info-label">学科：</span>
                                <span className="info-value">{teacher.subject}</span>
                              </div>
                              <div>
                                <span className="info-label">任教班级：</span>
                                <span className="info-value">{formatClasses(teacher.classes)}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEnable(teacher.id!)}
                            className="btn-approve"
                          >
                            <Check className="w-4 h-4" />
                            启用
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'all' && (
            <>
              {allTeachers.filter(t => t.role === 'teacher').length === 0 ? (
                <div className="empty-state">暂无教师</div>
              ) : (
                <div className="space-y-4">
                  {allTeachers
                    .filter(t => t.role === 'teacher')
                    .map(teacher => (
                      <div key={teacher.id} className="teacher-item">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-gray-900">{teacher.name}</h3>
                              <span className={`status-badge ${
                                teacher.status === 'active' 
                                  ? 'status-badge-active'
                                  : teacher.status === 'pending'
                                    ? 'status-badge-pending'
                                    : teacher.status === 'disabled'
                                      ? 'status-badge-disabled'
                                      : 'status-badge-pending'
                              }`}>
                                {teacher.status === 'active' ? '已启用' : 
                                 teacher.status === 'pending' ? '待审核' : 
                                 teacher.status === 'disabled' ? '已禁用' : '待审核'}
                              </span>
                            </div>
                            <div className="info-grid">
                              <div>
                                <span className="info-label">用户名：</span>
                                <span className="info-value">{teacher.username}</span>
                              </div>
                              <div>
                                <span className="info-label">学科：</span>
                                <span className="info-value">{teacher.subject}</span>
                              </div>
                              <div>
                                <span className="info-label">任教班级：</span>
                                <span className="info-value">{formatClasses(teacher.classes)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {teacher.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(teacher.id!)}
                                  className="btn-approve"
                                >
                                  <Check className="w-4 h-4" />
                                  通过
                                </button>
                                <button
                                  onClick={() => handleReject(teacher.id!)}
                                  className="btn-reject"
                                >
                                  <X className="w-4 h-4" />
                                  拒绝
                                </button>
                              </>
                            )}
                            {teacher.status === 'active' && (
                              <button
                                onClick={() => handleDisable(teacher.id!)}
                                className="btn-disable"
                              >
                                禁用
                              </button>
                            )}
                            {teacher.status === 'disabled' && (
                              <button
                                onClick={() => handleEnable(teacher.id!)}
                                className="btn-approve"
                              >
                                <Check className="w-4 h-4" />
                                启用
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}