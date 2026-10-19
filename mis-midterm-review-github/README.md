# MIS 期中考選擇題複習

純靜態、可離線使用的選擇題複習網站，包含第 1、2、3、4、13、14 章，共 360 題。

## 隱私與費用

- 不使用 OpenAI API、ChatGPT API 或任何 AI 模型。
- 不需要 API Key、Access Token、帳號或後端伺服器。
- 不含分析工具、廣告、追蹤碼或外部網路請求。
- 作答紀錄只保存在使用者瀏覽器的 `localStorage`，不會上傳。
- 使用與部署網站不會消耗 OpenAI Token。

## 直接使用

下載整個資料夾後，直接以瀏覽器開啟 `index.html`。題庫已包在本機 JavaScript 檔案中，不需要啟動伺服器或安裝套件。

## 推送到 GitHub

```bash
git init -b main
git add .
git commit -m "Add MIS review site"
git remote add origin https://github.com/YOUR_NAME/YOUR_REPOSITORY.git
git push -u origin main
```

## 啟用 GitHub Pages

1. 在 GitHub Repository 打開 `Settings` → `Pages`。
2. 將 `Source` 設定為 `GitHub Actions`。
3. 推送到 `main` 後，內附的工作流程會自動部署網站。

GitHub Actions 使用 GitHub 自動提供的短期 `GITHUB_TOKEN`；它不會寫入程式碼，也不是你的 OpenAI Token。

## 安全注意事項

`.gitignore` 已排除環境變數、金鑰、憑證、Codex/Sites 設定、原始 Word 文件及常見建置產物。提交前仍建議執行：

```bash
git status --short
git diff --cached
```

本網站是純前端程式，因此瀏覽器必須取得題目與答案才能離線判分。請勿把真正需要保密的考題、答案或個人資料放進公開的 GitHub Repository；純靜態網站無法對訪客隱藏這些資料。

## 檔案

- `index.html`：網站入口與安全政策
- `styles.css`：響應式介面樣式
- `app.js`：作答、進度與錯題功能
- `questions-data.js`：題目與答案資料
- `.github/workflows/pages.yml`：GitHub Pages 部署流程
