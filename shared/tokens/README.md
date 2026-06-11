# Russ Redesign tokens (RR)

Токены из Figma (W3C Design Tokens) собираются в CSS-переменные `--rr-*`.

## Источник

JSON-файлы:

- `tokens/source/` — каноническая папка (при сборке копируется из `tockens/`, если пусто)
- `tockens/` — legacy-путь (экспорт из Figma, можно продолжать класть сюда)

## Сборка

```bash
cd bibli
npm run tokens:build
```

Результат:

- `shared/tokens/generated/*.css` — слои (primitives, semantic, components, typography, dimensions, density)
- `shared/tokens/generated/index.css` — импорт всех слоёв
- `shared/tokens/tokens.flat.json` — плоский справочник для JS/PrimeVue

## Подключение в приложении

```css
@import '@russ-ui/bibli/shared/theme/theme.css'; /* legacy, опционально */
@import '@russ-ui/bibli/shared/tokens/index.css';
```

```html
<html data-rr data-color-mode="light" data-rr-density="100" data-rr-viewport="desktop">
```

```ts
document.documentElement.toggleAttribute('data-rr', true);
document.documentElement.dataset.colorMode = 'light'; // | dark
```

## Брейкпоинты (Adaptives)

| Назначение | Токен / константа | Значение |
|------------|-------------------|----------|
| Mobile artboard | `--rr-adaptives-width-mobile` | `390px` |
| Desktop artboard | `--rr-adaptives-width-desktop` | `1440px` |
| Split layout (форма + hero) | `--rr-adaptives-layout-split-min` | `1024px` |

Файлы: `adaptives.css`, `adaptives.js`.

- `data-rr-viewport="mobile"` — ширина &lt; 1024px (или клавиатура).
- `data-rr-layout="split"` — ширина ≥ 1024px (если влезает по высоте).
- CSS desktop-only (main-max, OTP 70px) — `min-width: 1440px`.

## Слои

| Файл | Содержимое |
|------|------------|
| `primitives-*.css` | Палитра 3.1 Primitives |
| `semantic-*.css` | Semantic (фоны, текст, actions) |
| `components-*.css` | Компонентные токены (Button.* и т.д.) |
| `typography-*.css` | Desktop / Mobile шрифты |
| `dimensions-*.css` | Отступы, layout |
| `density-*.css` | Масштаб 75% / 100% / 116% / 133% |

## Мост на старые компоненты

`bridge/legacy-russ.css` подставляет `--russ-*` из `--rr-*`, чтобы `shared/ui/legacy` работали на новых цветах без переписывания.

## Обновление из Figma

1. Экспорт JSON → `bibli/tokens/source/` (или `tockens/`)
2. `npm run tokens:build`
3. Коммит `generated/` + `tokens.flat.json`
