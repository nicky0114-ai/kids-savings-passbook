# 🌟 專屬兒童「家庭雲端電子存摺」使用與部署指南

這是一套專為孩子設計的家庭雲端電子存摺 Web 應用程式。支援**即時雲端同步**、**自訂 Canva 存摺封面**、**家長 PIN 碼防誤觸記帳**、**願望存錢筒進度條**與**資料永久雙重備份**！

---

## 🎨 第一步：匯入孩子在 Canva 設計的存摺封面

孩子在 Canva 設計的封面連結：`https://canva.link/okazy67abud3bjt`

### 下載與套用步驟：
1. 打開 Canva 設計頁面，點擊右上角 **「分享 (Share)」** ➔ **「下載 (Download)」**。
2. 檔案類型選擇 **PNG** 或 **JPG**，儲存到電腦或手機相簿中。
3. 打開電子存摺網頁，點擊右上角 **「家長記帳與管理」** ➔ 輸入 PIN 碼（預設 `1234`）。
4. 切換至 **「🎨 Canva 封面與存摺設定」** 分頁。
5. 點擊 **「選擇檔案」** 上傳剛下載好的圖片，並點擊下方 **「儲存存摺設定」**。
6. 存摺封面就會立即換成孩子親手製作的專屬封面！

---

## 🔥 第二步：建立免費 Google Firebase 雲端資料庫（3 分鐘設定）

使用 Firebase Firestore 可以讓您在手機記帳時，孩子在平板/電腦**即時看到金額變動與金幣動畫**，且資料永久儲存，再也不用擔心資料被清空。

### 快速建立流程：
1. 前往 [Firebase Console 控制台](https://console.firebase.google.com/)，使用您的 Google 帳號登入。
2. 點擊 **「建立專案 (Add project)」**，輸入專案名稱（例如：`kids-savings-passbook`），點擊繼續完成建立。
3. 建立 Firestore 資料庫：
   - 點擊左側選單 **「Build (建構)」** ➔ **「Firestore Database」** ➔ **「建立資料庫 (Create database)」**。
   - 地區可選預設或 `asia-east1 (台灣)`。
   - 安全規則選擇 **「以測試模式啟動 (Start in test mode)」**（允許家庭內各裝置直接讀寫）➔ 點擊啟用。
4. 取得 Web Config 設定代碼：
   - 回到專案總覽，點擊網頁圖示 `</>`（新增網頁應用程式）。
   - 輸入暱稱（例如：`kids-passbook-web`）➔ 點擊註冊應用程式。
   - 複製畫面中出現的 `const firebaseConfig = { ... };` 括號內的那段 JSON 物件。
5. 貼入電子存摺：
   - 在電子存摺網頁中點擊 **「家長記帳與管理」** ➔ 切換至 **「Firebase 雲端資料庫」**。
   - 貼上剛複製的設定代碼，點擊 **「測試並連接 Firebase」**。
   - 頂部狀態燈轉為綠色 🟢 **「Firebase 雲端即時連線中」** 即代表串接成功！

---

## 🚀 第三步：免費發布到 GitHub Pages 讓孩子隨時在手機查看

### 部署到 GitHub Pages：
1. 在您的 [GitHub](https://github.com/) 上建立一個新的公開 Repository（儲存庫），例如：`kids-savings-passbook`。
2. 將本專案的所有檔案（`index.html`、`css/`、`js/` 等）上傳至該 Repository 的 `main` 分支。
3. 進入該 Repository 的 **Settings (設定)** ➔ 點擊左側 **Pages**。
4. 在 **Build and deployment** 下方，**Source** 選擇 `Deploy from a branch`，Branch 選擇 `main` / `root` ➔ 點擊 **Save**。
5. 稍等 1~2 分鐘，GitHub 就會提供專屬的免費線上網址（例如：`https://你的GitHub帳號.github.io/kids-savings-passbook/`）！

---

## 📱 使用情境與互動小撇步

- **孩子的平板/手機**：
  - 將專屬網址加入手機主畫面（書籤或捷徑），外觀就像一個真正的銀行 App！
  - 孩子只能查帳、看存錢進度條，無法修改金額（受家長 PIN 碼保護）。
- **爸媽的手機**：
  - 打開同一網址，點「家長記帳與管理」輸入 PIN 碼。
  - 當孩子幫忙洗碗、做家事或有好表現時，立刻存入 $50 獎勵。
  - 孩子端**瞬間會跳出金幣音效與慶祝撒花 🎉**，成就感十足！
- **每月利息日**：
  - 在管理後台一鍵發放「定期儲蓄利息」，讓孩子建立「利滾利」的理財觀念。
- **定期雙重備份**：
  - 後台內建「匯出 JSON 備份檔」功能，可定期下載備份存檔，100% 絕不遺失。
