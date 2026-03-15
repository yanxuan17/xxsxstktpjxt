import { useCallback } from 'react';

export function useDateStorage<T>(key: string) {
  const getStorageKey = (date: string) => `${key}_${date}`;

  const getData = useCallback((date: string): T | null => {
    const data = localStorage.getItem(getStorageKey(date));
    return data ? JSON.parse(data) : null;
  }, [key]);

  const setData = useCallback((date: string, data: T) => {
    localStorage.setItem(getStorageKey(date), JSON.stringify(data));
  }, [key]);

  const getAllDates = useCallback((): string[] => {
    const dates: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(key + '_')) {
        dates.push(k.replace(key + '_', ''));
      }
    }
    return dates.sort();
  }, [key]);

  const getDataRange = useCallback((startDate: string, endDate: string): Record<string, T> => {
    const result: Record<string, T> = {};
    const dates = getAllDates();
    dates.forEach(date => {
      if (date >= startDate && date <= endDate) {
        const data = getData(date);
        if (data) {
          result[date] = data;
        }
      }
    });
    return result;
  }, [getAllDates, getData]);

  return { getData, setData, getAllDates, getDataRange };
}
