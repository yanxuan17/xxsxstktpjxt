import { useState, useEffect, useCallback } from 'react';
import type { User, ClassInfo, RegisteredUser } from '@/types';

const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

// Admin account
const ADMIN_ACCOUNT: RegisteredUser = {
  id: 'admin',
  username: 'yan',
  password: '123456',
  name: '管理员',
  role: 'admin',
  subject: '数学',
  classes: [{ grade: '六年级', classNumber: 1, fullName: '六年级(1)班' }],
  status: 'active',
  createdAt: new Date().toISOString()
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingTeachers, setPendingTeachers] = useState<RegisteredUser[]>([]);
  const [allTeachers, setAllTeachers] = useState<RegisteredUser[]>([]);

  // 加载所有教师数据
  const loadAllTeachers = useCallback(() => {
    const savedUsers = localStorage.getItem('eco_registered_users');
    if (savedUsers) {
      const users: RegisteredUser[] = JSON.parse(savedUsers);
      console.log('加载教师数据 - 原始数据:', users);
      
      // 创建新数组确保 React 状态更新
      setAllTeachers([...users]);
      
      // 筛选待审核教师 - 确保 status 字段正确
      const pending = users.filter(u => u.role === 'teacher' && u.status === 'pending');
      console.log('待审核教师:', pending);
      setPendingTeachers([...pending]);
      
      return users;
    }
    return [];
  }, []);

  // 保存数据到 localStorage 并更新状态
  const saveUsers = useCallback((users: RegisteredUser[]) => {
    console.log('保存用户数据:', users);
    localStorage.setItem('eco_registered_users', JSON.stringify(users));
    
    // 更新所有教师列表
    setAllTeachers([...users]);
    
    // 更新待审核列表
    const pending = users.filter(u => u.role === 'teacher' && u.status === 'pending');
    console.log('更新后待审核教师:', pending);
    setPendingTeachers([...pending]);
    
  }, []);

  // Initialize admin account and registered users
  useEffect(() => {
    const savedUsers = localStorage.getItem('eco_registered_users');
    if (!savedUsers) {
      saveUsers([ADMIN_ACCOUNT]);
    } else {
      const users: RegisteredUser[] = JSON.parse(savedUsers);
      // Ensure admin exists
      if (!users.find(u => u.username === 'yan')) {
        users.push(ADMIN_ACCOUNT);
        saveUsers(users);
      } else {
        loadAllTeachers();
      }
    }
  }, [loadAllTeachers, saveUsers]);

  useEffect(() => {
    const savedUser = localStorage.getItem('eco_current_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setIsLoggedIn(true);
    }
  }, []);

  const login = (username: string, password: string): { success: boolean; message: string; user?: User } => {
    const savedUsers = localStorage.getItem('eco_registered_users');
    if (!savedUsers) {
      return { success: false, message: '系统错误，请联系管理员' };
    }

    const users: RegisteredUser[] = JSON.parse(savedUsers);
    const foundUser = users.find(u => u.username === username && u.password === password);

    if (!foundUser) {
      return { success: false, message: '用户名或密码错误' };
    }

    // 检查教师状态
    if (foundUser.role === 'teacher' && foundUser.status !== 'active') {
      return { success: false, message: '账号待审核或已禁用，请联系管理员' };
    }

    const userData: User = {
      id: foundUser.id || `user_${Date.now()}`,
      username: foundUser.username,
      name: foundUser.name,
      role: foundUser.role,
      subject: foundUser.subject,
      classes: foundUser.classes,
      currentClass: foundUser.classes[0],
    };

    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('eco_current_user', JSON.stringify(userData));
    
    return { 
      success: true, 
      message: '登录成功',
      user: userData
    };
  };

  const register = (username: string, password: string, name: string, subject: string, classes: ClassInfo[]): { success: boolean; message: string } => {
    const savedUsers = localStorage.getItem('eco_registered_users');
    const users: RegisteredUser[] = savedUsers ? JSON.parse(savedUsers) : [];

    // Check if username exists
    if (users.find(u => u.username === username)) {
      return { success: false, message: '用户名已存在' };
    }

    const newUser: RegisteredUser = {
      id: `teacher_${Date.now()}`,
      username,
      password,
      name,
      role: 'teacher',
      subject,
      classes,
      status: 'pending',  // 确保状态为 pending
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);
    
    return { success: true, message: '注册成功，等待管理员审核' };
  };

  // 审核通过教师
  const approveTeacher = (teacherId: string) => {
    console.log('approveTeacher called with ID:', teacherId);
    
    const savedUsers = localStorage.getItem('eco_registered_users');
    if (!savedUsers) return false;

    const users: RegisteredUser[] = JSON.parse(savedUsers);
    const teacherIndex = users.findIndex(u => u.id === teacherId);
    
    if (teacherIndex !== -1) {
      users[teacherIndex].status = 'active';
      saveUsers(users);
      console.log('教师已通过审核:', users[teacherIndex]);
      return true;
    }
    return false;
  };

  // 拒绝/删除教师
  const rejectTeacher = (teacherId: string) => {
    console.log('rejectTeacher called with ID:', teacherId);
    
    const savedUsers = localStorage.getItem('eco_registered_users');
    if (!savedUsers) return false;

    let users: RegisteredUser[] = JSON.parse(savedUsers);
    users = users.filter(u => u.id !== teacherId);
    saveUsers(users);
    console.log('教师已拒绝:', teacherId);
    return true;
  };

  // 禁用教师
  const disableTeacher = (teacherId: string) => {
    console.log('disableTeacher called with ID:', teacherId);
    
    const savedUsers = localStorage.getItem('eco_registered_users');
    if (!savedUsers) return false;

    const users: RegisteredUser[] = JSON.parse(savedUsers);
    const teacherIndex = users.findIndex(u => u.id === teacherId);
    
    if (teacherIndex !== -1) {
      users[teacherIndex].status = 'disabled';
      saveUsers(users);
      console.log('教师已禁用:', users[teacherIndex]);
      return true;
    }
    return false;
  };

  // 启用教师
  const enableTeacher = (teacherId: string) => {
    console.log('enableTeacher called with ID:', teacherId);
    
    const savedUsers = localStorage.getItem('eco_registered_users');
    if (!savedUsers) return false;

    const users: RegisteredUser[] = JSON.parse(savedUsers);
    const teacherIndex = users.findIndex(u => u.id === teacherId);
    
    if (teacherIndex !== -1) {
      users[teacherIndex].status = 'active';
      saveUsers(users);
      console.log('教师已启用:', users[teacherIndex]);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('eco_current_user');
  };

  const switchClass = useCallback((classInfo: ClassInfo) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, currentClass: classInfo };
      localStorage.setItem('eco_current_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const switchSubject = useCallback((subject: string) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, subject };
      localStorage.setItem('eco_current_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getGradeSegment = (grade: string): 'low' | 'middle' | 'high' => {
    if (grade.includes('一') || grade.includes('二')) return 'low';
    if (grade.includes('三') || grade.includes('四')) return 'middle';
    return 'high';
  };

  const getCurrentSegment = (): 'low' | 'middle' | 'high' => {
    if (!user?.currentClass) return 'middle';
    return getGradeSegment(user.currentClass.grade);
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  return { 
    user, 
    isLoggedIn, 
    login, 
    register,
    logout, 
    switchClass,
    switchSubject,
    getCurrentSegment,
    isAdmin,
    GRADES,
    pendingTeachers,
    allTeachers,
    approveTeacher,
    rejectTeacher,
    disableTeacher,
    enableTeacher
  };
}