# 一键截图：保存或复制（Chrome 扩展）

功能：
- 截取当前标签页“可视区域”
- 一键“保存到本地下载目录”或“复制到剪贴板”（PNG）

## 安装
1. 打开 Chrome，访问：`chrome://extensions/`
2. 右上角开启“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择本项目目录：`/workspace/chrome-screenshot-extension`

## 使用
- 点击扩展图标打开弹窗
- 选择：
  - “保存到本地”：自动下载为 `screenshot-YYYYMMDD-HHMMSS.png`
  - “复制到剪贴板”：把图片直接写入系统剪贴板

## 权限说明
- `activeTab`/`tabs`：获取当前活动标签页并截图
- `downloads`：保存图片到本地
- `clipboardWrite`：写入剪贴板
- `storage`/`scripting`：为后续扩展保留（当前版本未强依赖）

## 备注
- 目前支持截图“可视区域”。如需“整页截图/区域截图”，可在后续版本中加入滚动拼接或框选功能。