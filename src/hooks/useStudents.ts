import { useState, useEffect, useCallback, useRef } from 'react';
import type { StudentInfo, ClassInfo } from '@/types';

export function useStudents(classInfo?: ClassInfo) {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevClassInfoRef = useRef<string | undefined>();

  const storageKey = classInfo ? `eco_students_${classInfo.grade}_${classInfo.classNumber}` : 'eco_students_default';

  // 加载学生数据 - 修复无限循环问题
  useEffect(() => {
    if (!classInfo) return;

    // 防止重复加载相同班级
    const classKey = `${classInfo.grade}_${classInfo.classNumber}`;
    if (prevClassInfoRef.current === classKey) return;
    prevClassInfoRef.current = classKey;

    setLoading(true);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setStudents(JSON.parse(saved));
      } else {
        // Generate default students
        const defaultStudents = Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          name: `学生${i + 1}`,
          className: classInfo.fullName,
        }));
        setStudents(defaultStudents);
        localStorage.setItem(storageKey, JSON.stringify(defaultStudents));
      }
      setError(null);
    } catch (err) {
      console.error('加载学生数据失败:', err);
      setError('加载学生数据失败');
    } finally {
      setLoading(false);
    }
  }, [storageKey, classInfo?.grade, classInfo?.classNumber, classInfo?.fullName]);

  const updateStudentName = useCallback((id: number, name: string) => {
    setStudents(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, name } : s);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [storageKey]);

  const importStudents = useCallback((data: { id: number; name: string }[]) => {
    if (!classInfo) {
      console.error('导入失败：未选择班级');
      return false;
    }
    
    try {
      if (!Array.isArray(data) || data.length === 0) {
        console.error('导入失败：数据为空');
        return false;
      }

      const imported = data.map((item, index) => {
        const id = typeof item.id === 'number' ? item.id : index + 1;
        const name = item.name ? String(item.name).trim() : `学生${id}`;
        
        return {
          id: id,
          name: name,
          className: classInfo.fullName,
        };
      });
      
      setStudents(imported);
      localStorage.setItem(storageKey, JSON.stringify(imported));
      
      console.log(`成功导入 ${imported.length} 名学生`);
      return true;
      
    } catch (error) {
      console.error('导入失败:', error);
      return false;
    }
  }, [storageKey, classInfo]);

  // 为了兼容性保留 importFromExcel 函数
  const importFromExcel = importStudents;

  const getStudentById = useCallback((id: number): StudentInfo | undefined => {
    return students.find(s => s.id === id);
  }, [students]);

  return { 
    students, 
    loading,
    error,
    updateStudentName, 
    importStudents, 
    importFromExcel, 
    getStudentById 
  };
}