# App 按鈕統一規範

Version 1.0.24 起，主要操作與危險操作使用共用元件：

```tsx
import { PrimaryButton, DangerButton } from '@/components/ui/action-button';

<PrimaryButton title="完成" onPress={handleComplete} />
<DangerButton title="清除" onPress={handleClear} />
```

## 標準尺寸

- 寬度：120px
- 高度：50px
- 文字大小：15px
- 字重：600
- 圓角：12px
- 按鈕間距：16px
- 掃描頁按鈕區與底部分頁距離：50px

## 顏色

- 主要按鈕：`#1E63FF`，白字
- 危險按鈕：`#FF3B30`，白字

顏色與尺寸使用 React Native `StyleSheet` 設定，避免 NativeWind 動態類別或透明色造成實機底色未顯示。
