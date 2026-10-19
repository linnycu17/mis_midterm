# Security

## Secret handling

此專案不需要任何祕密資訊。請勿將 API Key、Token、密碼、憑證或個人資料加入 Repository。

如需自行修改網站，請確認所有敏感檔案均符合 `.gitignore` 規則，並在推送前檢查 Git 暫存區。

## Static content limitation

所有純前端資料都能被網站訪客下載及檢視，包括 `questions-data.js` 內的題目與答案。需要保密的資料不應放進本專案或任何公開 GitHub Pages 網站。
