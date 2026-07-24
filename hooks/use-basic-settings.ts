import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BasicSettings {
  code: string;
  sendUrl: string;
  remark1: string;
  remark2: string;
  remark3: string;
}

const STORAGE_KEY = 'qr_basic_settings';

export function useBasicSettings() {
  const [settings, setSettings] = useState<BasicSettings>({
    code: '',
    sendUrl: '',
    remark1: '',
    remark2: '',
    remark3: '',
  });

  const [isLoading, setIsLoading] = useState(true);

  // 載入設定
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 直接從 AsyncStorage 讀取最新已儲存設定（不依賴 React state，
  // 供送出等關鍵動作即時取得最新值，避免 hook 實例間 state 不同步）
  const getStoredSettings = async (): Promise<BasicSettings> => {
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
    return settings;
  };

  // 儲存設定
  const saveSettings = async (newSettings: BasicSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  };

  // 更新單個欄位
  const updateField = (field: keyof BasicSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 批次更新多個欄位（供掃描 QR Code 帶入設定使用）
  const applyFields = (fields: Partial<BasicSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...fields,
    }));
  };

  // 清除所有設定
  const clearSettings = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSettings({
        code: '',
        sendUrl: '',
        remark1: '',
        remark2: '',
        remark3: '',
      });
      return true;
    } catch (error) {
      console.error('Failed to clear settings:', error);
      return false;
    }
  };

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
