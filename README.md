# Interview 2.0

Список вопросов для подготовки к техническому собеседованию с фильтрами по категориям и сложности.

## Деплой: статичный HTML

`npm run deploy` (и `npm run build`) собирают сайт как **один самодостаточный `dist/index.html`**
(скрипт [scripts/build-static.mjs](scripts/build-static.mjs)) — без React/Vite-рантайма и
`<script type="module">`. Все вопросы отрисованы напрямую в HTML через `<details>`/`<summary>`,
поэтому текст читается даже при полностью отключённом JavaScript — это важно для встроенных
браузеров электронных книг (Kindle, PocketBook, Onyx Boox и т.п.), у которых часто нет ES-модулей
или JS вовсе. Фильтры по категориям/сложности и режим случайной подборки — необязательное
улучшение поверх: обычный `<script>` в конце файла (код в стиле ES5, без стрелочных функций и
шаблонных строк) просто показывает/скрывает уже отрисованные карточки.

```bash
npm run build          # генерирует dist/index.html из public/questions.json
npm run preview:static # локальный просмотр dist/ на http://localhost:4173
npm run deploy         # build + публикация dist/ в ветку gh-pages
```

## Разработка (React/Vite SPA)

Оригинальная React-версия (react-router, react-query, tanstack-virtual) осталась в `src/` и
используется только для локальной разработки/дальнейших изменений — в проде она не публикуется.

```bash
npm run dev       # dev-сервер Vite с HMR
npm run build:app # прод-сборка SPA (tsc -b && vite build), не используется в деплое
npm run lint
```

## Данные

`public/questions.json` — источник вопросов (используются поля `id`, `title`, `shortAnswer`,
`complexity`, `questionSkills`). И React-компонент [Card](src/components/Card/index.tsx), и
генератор статики читают эти же поля — при добавлении новых полей фильтрации меняйте оба места.
