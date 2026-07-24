import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ScanSettings {
  targetUrl: string;
  httpMethod: "POST" | "GET";
  paramName: string;
}

const STORAGE_KEY = "@scan_settings";

const DEFAULT_SETTINGS: ScanSettings = {
  targetUrl: "",
  httpMethod: "POST",
  paramName: "data",
};

export function useScanSettings() {
  const [settings, setSettings] = useState<ScanSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
        }
      } catch {
        // ignore
      }
      setLoaded(true);
    })();
  }, []);

  const saveSettings = useCallback(async (next: ScanSettings) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  return { settings, saveSettings, loaded };
}
