import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BasicSettings } from '@/types/settings';

export type { BasicSettings } from '@/types/settings';

const STORAGE_KEY = 'qr_basic_settings';

const EMPTY_SETTINGS: BasicSettings = {
  code: '',
  sendUrl: '',
  remark1: '',
  remark2: '',
  remark3: '',
};

export function useBasicSettings() {
  const [settings, setSettings] = useState<BasicSettings>(EMPTY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored) as BasicSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  // 直接從 AsyncStorage 讀取最新已儲存設定，避免不同 Hook 實例間的 state 不同步。
  const getStoredSettings = useCallback(async (): Promise<BasicSettings> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BasicSettings;
        setSettings(parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Failed to read stored settings:', error);
    }
    return EMPTY_SETTINGS;
  }, []);

  const saveSettings = useCallback(async (newSettings: BasicSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }, []);

  const updateField = useCallback((field: keyof BasicSettings, value: string) => {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));
  }, []);

  const applyFields = useCallback((fields: Partial<BasicSettings>) => {
    setSettings((previous) => ({
      ...previous,
      ...fields,
    }));
  }, []);

  const clearSettings = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSettings(EMPTY_SETTINGS);
      return true;
    } catch (error) {
      console.error('Failed to clear settings:', error);
      return false;
    }
  }, []);

  return {
    settings,
    isLoading,
    loadSettings,
    getStoredSettings,
    saveSettings,
    updateField,
    applyFields,
    clearSettings,
  };
}
