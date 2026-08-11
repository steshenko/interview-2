#!/usr/bin/env node
/**
 * Генерирует полностью статичный, самодостаточный index.html без React/Vite-рантайма
 * и без ES-модулей — чтобы страница открывалась даже в очень старых/урезанных браузерах
 * (ридеры вроде Kindle/PocketBook/Onyx Boox), в том числе при отключённом JS.
 *
 * Весь список вопросов рендерится сразу в HTML (через <details>, которые раскрываются
 * нативно без единой строчки JS). Фильтры по категориям/сложности и режим подборки —
 * это необязательное улучшение поверх: обычный <script> (не type="module", код в стиле ES5),
 * который просто скрывает/показывает уже отрисованные карточки.
 */
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const SKILL_FILTERS = [
    { id: 'html', label: 'HTML', skillTitle: 'HTML' },
    { id: 'css', label: 'CSS', skillTitle: 'CSS' },
    { id: 'js', label: 'JavaScript', skillTitle: 'JavaScript' },
    { id: 'ts', label: 'TypeScript', skillTitle: 'TypeScript' },
    { id: 'react', label: 'React', skillTitle: 'React' },
    { id: 'git', label: 'Git', skillTitle: 'Git' },
];

const DIFFICULTY_FILTERS = [
    { id: 'd13', label: '1–3' },
    { id: 'd46', label: '4–6' },
    { id: 'd78', label: '7–8' },
    { id: 'd910', label: '9–10' },
];

function difficultyTier(complexity) {
    const c = complexity == null ? 5 : Math.min(10, Math.max(1, complexity));
    if (c <= 3) return 'd13';
    if (c <= 6) return 'd46';
    if (c <= 8) return 'd78';
    return 'd910';
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    return escapeHtml(str);
}

/**
 * shortAnswer — доверенный, но не безупречный HTML (в паре ответов встречаются
 * буквальные "<script>"/"<style>" как часть примера кода). script/style/textarea/title —
 * «raw text»-элементы: браузер читает их содержимое как текст вплоть до закрывающего тега,
 * игнорируя вложенные теги. Случайный "<script>" внутри ответа поэтому обрывает разметку
 * страницы и «съедает» весь HTML вплоть до следующего "</script>" — в том числе наш
 * настоящий интерактивный скрипт. Экранируем такие последовательности до вставки.
 */
function neutralizeRawTextTags(html) {
    return String(html || '').replace(/<(\/?)(script|style|textarea|title)/gi, '&lt;$1$2');
}

const questionsPath = path.join(root, 'public', 'questions.json');
const raw = JSON.parse(readFileSync(questionsPath, 'utf8'));

const questions = raw.map((q) => {
    const skillIds = SKILL_FILTERS.filter((f) =>
        (q.questionSkills || []).some((s) => s.title === f.skillTitle),
    ).map((f) => f.id);
    // Тема вопроса — реальные теги из данных (не ограничены 6 категориями тулбара),
    // чтобы у React/Redux/Webpack-вопросов тоже была подпись, а не только у HTML/CSS/JS/TS/React/Git.
    const topics = Array.from(
        new Set((q.questionSkills || []).map((s) => (s.title || '').trim()).filter(Boolean)),
    );
    return {
        id: q.id,
        title: q.title || '',
        shortAnswer: neutralizeRawTextTags(q.shortAnswer || ''),
        tier: difficultyTier(q.complexity),
        skillIds,
        topics,
    };
});

const DIFFICULTY_COLOR = {
    d13: '#8e8e93',
    d46: '#34c759',
    d78: '#ff9f0a',
    d910: '#ff453a',
};

// Уровень 1–4 для отрисовки закрашенных/пустых точек — не завязан на цвет,
// поэтому читаем на чёрно-белом экране (ридеры и т.п.)
const DIFFICULTY_LEVEL = { d13: 1, d46: 2, d78: 3, d910: 4 };

const DIFFICULTY_LABEL = Object.fromEntries(DIFFICULTY_FILTERS.map((d) => [d.id, d.label]));

function renderDifficultyDots(tier) {
    const level = DIFFICULTY_LEVEL[tier] || 1;
    let dots = '';
    for (let i = 1; i <= 4; i++) {
        dots += `<span class="dot${i <= level ? ' dot--filled' : ''}"></span>`;
    }
    return dots;
}

function renderPill(extraAttrs, label, active) {
    return `<button type="button" class="pill${active ? ' active' : ''}" ${extraAttrs}>${label}</button>`;
}

const skillPills = [
    renderPill('data-role="skill" data-skill="all"', 'All', true),
    ...SKILL_FILTERS.map((f) => renderPill(`data-role="skill" data-skill="${f.id}"`, escapeHtml(f.label))),
].join('\n                ');

const difficultyPills = DIFFICULTY_FILTERS.map((d) =>
    renderPill(`data-role="difficulty" data-difficulty="${d.id}" data-color="${DIFFICULTY_COLOR[d.id]}"`, d.label),
).join('\n                ');

const samplePills = [
    renderPill('data-role="sample" data-sample="all"', 'Все', true),
    renderPill('data-role="sample" data-sample="50"', '50 случайных'),
    renderPill('data-role="sample" data-sample="100"', '100 случайных'),
].join('\n                ');

const cardsHtml = questions
    .map((q) => {
        const topicsLabel = q.topics.join(', ');
        const topicHtml = topicsLabel
            ? `<span class="card-topic">${escapeHtml(topicsLabel)}</span>`
            : '';
        return `<details class="card" data-skills="${q.skillIds.join(',')}" data-difficulty="${q.tier}">
            <summary class="card-header">
                <span class="card-meta" title="Сложность ${escapeAttr(DIFFICULTY_LABEL[q.tier])}">${renderDifficultyDots(q.tier)}</span>
                ${topicHtml}<span class="card-title">${escapeHtml(q.title)}</span>
            </summary>
            ${q.shortAnswer ? `<div class="card-body">${q.shortAnswer}</div>` : ''}
        </details>`;
    })
    .join('\n');

const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Interview 2.0</title>
<style>
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #1d1d1f;
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
    font-size: 17px;
    line-height: 1.5;
  }
  .toolbar {
    padding: 10px 12px;
    border-bottom: 1px solid #e5e5ea;
  }
  .pill {
    display: inline-block;
    font: inherit;
    font-size: 12px;
    font-weight: 500;
    padding: 4px 9px;
    margin: 2px 3px 2px 0;
    border-radius: 999px;
    border: 1px solid #d2d2d7;
    background: #f5f5f7;
    color: #424245;
    cursor: pointer;
  }
  .pill.active {
    border-color: #0071e3;
    background: #e5f1fc;
    color: #1d1d1f;
  }
  .sep {
    display: inline-block;
    width: 1px;
    height: 14px;
    margin: 0 4px;
    background: #d2d2d7;
    vertical-align: middle;
  }
  .list {
    max-width: 860px;
    margin: 0 auto;
    padding: 0 16px 40px;
  }
  .card {
    border-bottom: 1px solid #e5e5ea;
    padding: 4px 0;
  }
  .card-header {
    display: block;
    padding: 14px 4px;
    cursor: pointer;
    list-style: none;
  }
  .card-header::-webkit-details-marker {
    display: none;
  }
  .card-title {
    font-size: 16px;
  }
  .card-topic {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: #6e6e73;
    border: 1px solid #c7c7cc;
    border-radius: 4px;
    padding: 1px 6px;
    margin-right: 8px;
    vertical-align: middle;
    white-space: nowrap;
  }
  .card-meta {
    float: right;
    white-space: nowrap;
    margin-left: 12px;
  }
  /* Уровень сложности 1–4: закрашенные точки считаются, а не различаются по цвету —
     видно и на чёрно-белом экране (e-ink ридеры). */
  .dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-left: 4px;
    border-radius: 50%;
    border: 1px solid #8e8e93;
    background: transparent;
    vertical-align: middle;
  }
  .dot--filled {
    background: #1d1d1f;
    border-color: #1d1d1f;
  }
  .card-body {
    padding: 0 4px 18px;
    color: #333336;
    font-size: 15px;
  }
  .card-body pre {
    background: #f5f5f7;
    border: 1px solid #e5e5ea;
    border-radius: 8px;
    padding: 12px 14px;
    overflow-x: auto;
    font-size: 13px;
  }
  .card-body code {
    background: #f0f0f2;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 13px;
  }
  .hidden {
    display: none;
  }
  .empty-state {
    text-align: center;
    color: #86868b;
    padding: 40px 16px;
  }
</style>
</head>
<body>
<div class="toolbar">
    <span class="pill-group">
        ${skillPills}
    </span>
    <span class="sep"></span>
    <span class="pill-group">
        ${difficultyPills}
    </span>
    <span class="sep"></span>
    <span class="pill-group">
        ${samplePills}
    </span>
</div>
<div class="list" id="list">
${cardsHtml}
</div>
<p class="empty-state hidden" id="empty-state">Нет карточек по выбранным фильтрам</p>
<script>
(function () {
    "use strict";
    if (!document.querySelectorAll) return;

    var cards = [];
    var nodes = document.querySelectorAll(".card");
    for (var i = 0; i < nodes.length; i++) cards.push(nodes[i]);

    var pills = [];
    var pillNodes = document.querySelectorAll(".pill");
    for (var j = 0; j < pillNodes.length; j++) pills.push(pillNodes[j]);

    var activeSkills = {};
    var activeDifficulty = {};
    var sampleMode = "all";

    function hasAny(obj) {
        for (var k in obj) if (obj[k]) return true;
        return false;
    }

    function matches(card) {
        var skills = (card.getAttribute("data-skills") || "").split(",");
        var difficulty = card.getAttribute("data-difficulty");
        if (hasAny(activeSkills)) {
            var skillOk = false;
            for (var s = 0; s < skills.length; s++) {
                if (activeSkills[skills[s]]) { skillOk = true; break; }
            }
            if (!skillOk) return false;
        }
        if (hasAny(activeDifficulty) && !activeDifficulty[difficulty]) return false;
        return true;
    }

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var r = Math.floor(Math.random() * (i + 1));
            var tmp = a[i]; a[i] = a[r]; a[r] = tmp;
        }
        return a;
    }

    function render() {
        var matched = [];
        for (var i = 0; i < cards.length; i++) {
            if (matches(cards[i])) matched.push(cards[i]);
            cards[i].className = "card hidden";
        }
        var visible = matched;
        if (sampleMode !== "all") {
            var cap = sampleMode === "50" ? 50 : 100;
            visible = shuffle(matched).slice(0, cap);
        }
        for (var v = 0; v < visible.length; v++) visible[v].className = "card";

        var emptyState = document.getElementById("empty-state");
        if (matched.length === 0) emptyState.className = "empty-state";
        else emptyState.className = "empty-state hidden";
    }

    for (var p = 0; p < pills.length; p++) {
        (function (pill) {
            pill.addEventListener("click", function () {
                var role = pill.getAttribute("data-role");
                if (role === "skill") {
                    var skill = pill.getAttribute("data-skill");
                    if (skill === "all") {
                        activeSkills = {};
                    } else {
                        activeSkills[skill] = !activeSkills[skill];
                    }
                } else if (role === "difficulty") {
                    var difficulty = pill.getAttribute("data-difficulty");
                    activeDifficulty[difficulty] = !activeDifficulty[difficulty];
                } else if (role === "sample") {
                    sampleMode = pill.getAttribute("data-sample");
                    for (var sp = 0; sp < pills.length; sp++) {
                        if (pills[sp].getAttribute("data-role") === "sample") {
                            pills[sp].className = "pill";
                        }
                    }
                    pill.className = "pill active";
                }

                if (role === "skill") {
                    var allPill = null;
                    for (var sk = 0; sk < pills.length; sk++) {
                        if (pills[sk].getAttribute("data-role") === "skill") {
                            var id = pills[sk].getAttribute("data-skill");
                            if (id === "all") { allPill = pills[sk]; continue; }
                            pills[sk].className = activeSkills[id] ? "pill active" : "pill";
                        }
                    }
                    if (allPill) allPill.className = hasAny(activeSkills) ? "pill" : "pill active";
                }
                if (role === "difficulty") {
                    for (var d = 0; d < pills.length; d++) {
                        if (pills[d].getAttribute("data-role") === "difficulty") {
                            var did = pills[d].getAttribute("data-difficulty");
                            var isActive = !!activeDifficulty[did];
                            pills[d].className = isActive ? "pill active" : "pill";
                            pills[d].style.borderColor = isActive ? pills[d].getAttribute("data-color") : "";
                        }
                    }
                }

                render();
            });
        })(pills[p]);
    }

    render();
})();
</script>
</body>
</html>
`;

const distDir = path.join(root, 'dist');
// Чистим dist от артефактов прошлых React/Vite-сборок (assets/*, favicon.svg и т.п.) —
// новая страница самодостаточна и ничего из них не использует.
rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');

const sizeKb = Buffer.byteLength(html, 'utf8') / 1024;
console.log(`Static site generated: dist/index.html (${sizeKb.toFixed(0)} KB, ${questions.length} questions)`);
