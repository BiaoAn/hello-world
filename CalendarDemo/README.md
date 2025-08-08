# 安卓 Jetpack Compose 日历 Demo

这是一个最小可运行的日历应用 Demo，使用 Kotlin 与 Jetpack Compose 构建：
- 月视图（日历网格，支持上下月份切换）
- 选中日期，高亮今天
- 为选中日期添加/删除简单文本事件（进程内存储，仅用于演示）

## 打开与运行
1. 使用 Android Studio (Giraffe+ 或更高版本) 打开项目目录：`/workspace/CalendarDemo`
2. 首次同步时如提示需要 Gradle Wrapper，请在 Android Studio 中执行 “Create Gradle Wrapper” 或在终端执行：
   ```bash
   cd /workspace/CalendarDemo
   ./gradlew tasks
   ```
   如果缺少 Wrapper，可用本地 Gradle 运行 `gradle wrapper` 生成。
3. 选择任意已连接设备/模拟器，运行 `app`。

## 主要技术栈
- Compose Material 3
- ViewModel + `mutableStateOf` 管理 UI 状态
- `java.time` API (minSdk 26)

## 结构
- `app/src/main/java/com/example/calendar/MainActivity.kt`: 主界面与日历逻辑
- `app/src/main/java/com/example/calendar/ui/theme/Theme.kt`: 主题封装
- `app/src/main/AndroidManifest.xml`: 清单
- `app/build.gradle.kts`: 模块构建配置

## 后续可扩展
- 使用 Room 或 DataStore 持久化事件
- 自定义主题/配色、动态颜色
- 周视图/日视图、事件详情页、提醒通知等