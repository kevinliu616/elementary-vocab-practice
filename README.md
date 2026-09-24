# 國中小必備英文單字練習

台灣國中小常用必背英文單字練習網頁應用，收錄 **2005 個單字**，提供五種練習模式，幫助學習者熟悉並背熟單字。

## 🌐 線上版（GitHub Pages）

直接開啟即可使用，手機、平板、電腦都支援：

**https://kevinliu616.github.io/elementary-vocab-practice/**

線上版使用 HTTPS，語音發音與跟讀辨識在 Chrome、Edge、Safari 皆可正常運作。

## ✨ 五種練習模式

| 模式 | 說明 |
|------|------|
| 📇 單字卡翻轉 | 看英文想中文，點卡片翻面確認，標記熟練度 |
| 📝 中選英測驗 | 看中文意思，從四個選項選出正確英文單字 |
| 🎯 英選中測驗 | 看英文單字，選出正確中文意思（滑鼠移過選項自動發音） |
| ⌨️ 拼字練習 | 看中文意思，打出正確英文拼字（顯示字母數提示） |
| 🗣️ 跟讀發音 | 聽標準發音後跟讀，語音辨識判斷發音是否正確 |

## 🚀 如何自行架設

### 方法一：GitHub Pages（推薦）

1. Fork 此倉庫，或直接使用線上版
2. 在倉庫設定（Settings → Pages）中選擇 `main` 分支即可發布

### 方法二：本機運行

下載 ZIP 或複製倉庫後，在專案資料夾執行：

```bash
python3 -m http.server 8766 --bind 127.0.0.1
```

然後用 Chrome 開啟 **http://localhost:8766**

> ⚠️ 語音辨識（跟讀功能）需要透過 `http://localhost` 或 HTTPS 開啟，直接雙擊 `index.html`（file://）會讓麥克風功能被瀏覽器停用。

## 📂 專案結構

```
├── index.html          # 主頁面（唯一入口）
├── style.css           # 樣式
├── app.js              # 程式邏輯
├── words-data.js       # 2005 個單字資料
└── README.md           # 本說明
```

## 🔧 技術說明

- 純前端：原生 HTML / CSS / JavaScript，無需建置工具
- 發音：Web Speech API（speechSynthesis）
- 跟讀辨識：Web Speech API（SpeechRecognition）
- 進度儲存：瀏覽器 localStorage（本機儲存，不會上傳）
- 單字來源：台灣國中小常用必背單字表

## 📄 授權

本專案僅供學習與個人使用。單字資料取自台灣國中小常用單字表，版權歸原作者所有。
