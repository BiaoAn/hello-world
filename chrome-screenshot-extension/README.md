# 一键截图：保存或复制（Chrome 扩展）

功能：
- 截取当前标签页“可视区域”
- 手动“选择区域”后截图（框选）
- 一键“保存到本地下载目录”或“复制到剪贴板”（PNG）

## 安装
1. 打开 Chrome，访问：`chrome://extensions/`
2. 右上角开启“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择本项目目录：`/workspace/chrome-screenshot-extension`

## 使用
- 点击扩展图标打开弹窗
- 选择：
  - “选择区域”：在页面上拖拽框选，完成后重新打开弹窗即可保存/复制选区
  - 未选择时，“保存到本地/复制到剪贴板”默认截取“可视区域”

## 权限说明
- `activeTab`/`tabs`：获取当前活动标签页并截图
- `scripting`：按需注入内容脚本以进行框选
- `downloads`：保存图片到本地
- `clipboardWrite`：写入剪贴板
- `storage`：临时缓存选区和截图数据（使用 `storage.session`）

## 限制与提示
- 浏览器受限页面无法注入内容脚本：`chrome://*`、Chrome Web Store（`https://chrome.google.com/webstore`）、扩展页面（`chrome-extension://*`），以及 Edge 外接商店等。
- `file://` 本地文件页面默认受限。如需在本地文件上使用，请在扩展详情中开启“允许访问文件网址”。
- 选择区域基于“可视区域”截图；整页滚动拼接可在后续版本加入。