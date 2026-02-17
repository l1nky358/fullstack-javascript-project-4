### Hexlet tests and linter status:
[![Actions Status](https://github.com/l1nky358/fullstack-javascript-project-4/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/l1nky358/fullstack-javascript-project-4/actions)

# Page Loader

[![Node.js CI](https://github.com/your-username/page-loader/actions/workflows/nodejs.yml/badge.svg)](https://github.com/your-username/page-loader/actions/workflows/nodejs.yml)

Page Loader — утилита командной строки для скачивания веб-страниц вместе со всеми локальными ресурсами с красивым отображением прогресса.

## ✨ Возможности

- 📥 Скачивание HTML-страниц с индикацией прогресса
- 🖼️ Параллельная загрузка изображений, стилей и скриптов
- 🎯 Отображение спиннеров и статусов загрузки
- 🔄 Graceful обработка ошибок
- 📍 Возврат полного пути к загруженному файлу

## 📦 Установка

```bash
npm install -g @hexlet/code

# Базовая загрузка
page-loader https://ru.hexlet.io/courses

# Загрузка в указанную директорию
page-loader --output /var/tmp https://ru.hexlet.io/courses

# Режим отладки
page-loader --debug https://ru.hexlet.io/courses


install:
	npm ci

test:
	npm test

test-coverage:
	npm run test:coverage

.PHONY: test
