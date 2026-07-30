# 禾詰 Native Bridge v1

## 目前已啟用

- `Bridge.camera()`：Android／iOS 直接開啟 APP 原生後鏡頭。
- `Bridge.version()`：取得 APP 版本，結果事件為 `hojie:version-result`。
- `Bridge.platform()`：取得 `android` 或 `ios`，結果事件為 `hojie:platform-result`。

以下名稱已預留，但 APP 尚未實作原生功能：

- `Bridge.scan()`
- `Bridge.gps()`
- `Bridge.signature()`
- `Bridge.record()`
- `Bridge.download()`

呼叫尚未實作的功能時，頁面會收到 `hojie:bridge-error` 事件。

## PHP 呼叫相機

```html
<button type="button" onclick="openNativeCamera()">開啟相機拍照</button>

<script>
function openNativeCamera() {
    const bridge = window.HoJieBridge || window.Bridge;

    if (bridge && typeof bridge.camera === 'function') {
        bridge.camera({ facing: 'back' });
        return;
    }

    // 非 APP 瀏覽器的備援流程
    document.getElementById('myFile').click();
}
</script>
```

APP 拍照完成後會送出：

```javascript
window.addEventListener('hojie:camera-result', function (event) {
    console.log(event.detail.base64);
    console.log(event.detail.mimeType);
    console.log(event.detail.fileName);
});
```

本次 `photo.php` 已將回傳的 Base64 轉成 `File`，放回原本的
`input[type=file]`，因此仍使用既有的：

- `upload.php`
- `image`
- `paramA`
- `paramB`

POST 欄位格式沒有更改。

## 未來新增功能時

`memu.php` 可新增連結到新的 PHP 頁面，例如：

```html
<a href="../3mbmmv/signature.php">簽名</a>
```

然後由 `signature.php` 呼叫：

```javascript
Bridge.signature();
```

注意：只有 APP 已經實作的 Bridge action 才能使用。新增 GPS、簽名、錄音等新的原生能力時，仍需先更新一次 APP；同類型功能後續可由不同 PHP 頁面重複呼叫，不必再修改 APP。
