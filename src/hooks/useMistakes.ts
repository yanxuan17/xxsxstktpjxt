import { useState, useEffect, useCallback } from 'react';
import { Mistake } from '@/types';

const STORAGE_KEY = 'eco_mistakes';

export function useMistakes(className?: string) {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载错题
  useEffect(() => {
    if (!className) return;
    setLoading(true);
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${className}`);
      if (saved) {
        setMistakes(JSON.parse(saved));
      } else {
        setMistakes([]);
      }
    } catch (error) {
      console.error('加载错题失败', error);
    } finally {
      setLoading(false);
    }
  }, [className]);

  // 保存错题
  const saveMistakes = useCallback((newMistakes: Mistake[]) => {
    if (!className) return;
    localStorage.setItem(`${STORAGE_KEY}_${className}`, JSON.stringify(newMistakes));
    setMistakes(newMistakes);
  }, [className]);

  // 添加单个错题
  const addMistake = useCallback((mistake: Mistake) => {
    const updated = [...mistakes, mistake];
    saveMistakes(updated);
  }, [mistakes, saveMistakes]);

  // 更新错题
  const updateMistake = useCallback((id: string, updates: Partial<Mistake>) => {
    const updated = mistakes.map(m => m.id === id ? { ...m, ...updates } : m);
    saveMistakes(updated);
  }, [mistakes, saveMistakes]);

  // 删除错题
  const deleteMistake = useCallback((id: string) => {
    const updated = mistakes.filter(m => m.id !== id);
    saveMistakes(updated);
  }, [mistakes, saveMistakes]);

  // 批量导入（用于从手机端同步）
  const importMistakes = useCallback((newMistakes: Mistake[]) => {
    // 简单合并，去重（根据id）
    const existingIds = new Set(mistakes.map(m => m.id));
    const uniqueNew = newMistakes.filter(m => !existingIds.has(m.id));
    const updated = [...mistakes, ...uniqueNew];
    saveMistakes(updated);
    return uniqueNew.length;
  }, [mistakes, saveMistakes]);

  return {
    mistakes,
    loading,
    addMistake,
    updateMistake,
    deleteMistake,
    importMistakes,
  };
}