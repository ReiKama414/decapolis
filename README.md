# Decapolis｜十城

在瀏覽器裡環視十座城市的 3D 天際線：日夜切換、自動旋轉、即時切城。

- GitHub: https://github.com/ReiKama414/decapolis
- Demo: https://reikama414.github.io/decapolis/
- Site: https://reikama414.vercel.app/

## 技術棧

- Three.js（CDN ESM + import map）
- OrbitControls / UnrealBloomPass 後處理
- 純靜態 HTML／JS（可 `file://` 或任意靜態託管）

## 啟動

用本機靜態伺服器開啟根目錄即可（建議，避免部分瀏覽器限制）：

```bash
npx --yes serve .
```

或直接用瀏覽器開啟 `index.html`。

需求：現代瀏覽器（WebGL2）。

## 操作

| 操作 | 說明 |
| --- | --- |
| 底部城市列 | 切換城市 |
| Night | 日／夜 |
| Rotate | 自動環繞 |
| 拖曳／滾輪 | 軌道相機 |

## 專案結構

```
decapolis/
├── index.html
├── assets/             # favicon、apple-touch-icon 等
├── js/core.js
└── js/cities/          # 各城場景定義
```

## 第三方授權與出處

| 項目 | 說明 |
| --- | --- |
| Three.js | MIT（CDN） |
| favicon | 以本機 ComfyUI（SDXL）生成，屬本專案資產 |

## License / 權限

**本專案以 MIT 授權開源**（與 `Code/README.md` 預設 All Rights Reserved 不同，已明確改授權）。

Copyright (c) 2026 ReiKama414

- GitHub: https://github.com/ReiKama414/decapolis
- Demo: https://reikama414.github.io/decapolis/
- Site: https://reikama414.vercel.app/
- Full text: see [LICENSE](./LICENSE)
