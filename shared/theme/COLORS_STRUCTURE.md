# Структура системы цветов russ-ui

## Принципы организации цветов

Система цветов организована по следующим принципам:

1. **Семантические имена** - цвета названы по их назначению, а не по внешнему виду
2. **Группировка по функциональности** - цвета сгруппированы по областям использования
3. **Единообразие** - похожие цвета объединены под одни переменные
4. **Расширяемость** - легко добавлять новые цвета и темы

## Группы цветов

### 1. Основные цвета (Primary)
Используются для основных действий, кнопок, ссылок
- `primary` - основной цвет бренда
- `primaryDark`, `primaryLight` - варианты основного цвета
- `primaryHover`, `primaryActive` - состояния интерактивных элементов
- `primaryGradientStart`, `primaryGradientEnd` - для градиентов

### 2. Вторичные цвета (Secondary)
Используются для второстепенных элементов
- `secondary` - вторичный цвет
- `secondaryDark`, `secondaryLight` - варианты

### 3. Акцентные цвета (Accent)
Используются для выделения важных элементов
- `accent` - акцентный цвет
- `accentDark`, `accentLight` - варианты
- `accentTint-*` - полупрозрачные варианты для фонов

### 4. Цвета текста (Text)
Иерархия цветов текста от самого темного до самого светлого
- `textPrimary` - основной текст (самый темный)
- `textSecondary` - вторичный текст
- `textTertiary` - третичный текст
- `textQuaternary` - четвертичный текст
- `textMuted` - приглушенный текст
- `textInverse` - инвертированный текст (белый на темном фоне)

### 5. Цвета фона (Background)
Иерархия фоновых цветов
- `background` - основной фон (белый)
- `backgroundSecondary` - вторичный фон
- `backgroundTertiary` - третичный фон
- `backgroundQuaternary` - четвертичный фон
- `backgroundHover` - фон при наведении
- `backgroundActive` - фон при активации
- `backgroundDisabled` - фон отключенных элементов
- Специальные фоны: `bg-blue-tint`, `bg-blue-light`, `bg-gray-light`

### 6. Цвета границ (Border)
Иерархия цветов границ
- `border` - основная граница
- `borderLight` - светлая граница
- `borderDark` - темная граница
- `borderQuaternary` - четвертичная граница

### 7. Цвета для инпутов (Input)
Специализированные цвета для полей ввода
- `inputBorder`, `inputBorderFocus`, `inputBorderError` - границы
- `inputBg`, `inputBgDisabled`, `inputBgHover` - фоны
- `inputText`, `inputPlaceholder` - текст
- `inputError`, `inputErrorBg` - ошибки

### 8. Статусные цвета (Status)
Цвета для отображения статусов
- **Success**: `success`, `successLight`, `successDark`, `successText`, `successBorder`
- **Error**: `error`, `errorLight`, `errorDark`, `errorText`
- **Warning**: `warning`, `warningLight`, `warningDark`, `warningText`
- **Info**: `info`, `infoLight`, `infoDark`, `infoText`, `infoBorder`

### 9. Нейтральные цвета (Neutral)
Серые оттенки для нейтральных элементов
- `neutral` - нейтральный цвет
- `neutralLight` - светлый нейтральный
- `neutralDark` - темный нейтральный

### 10. Специальные цвета
Цвета для специфических случаев
- `yellow`, `yellowLight` - желтые оттенки
- `orange`, `orangeLight` - оранжевые оттенки
- `purple`, `purpleLight` - фиолетовые оттенки

### 11. Дополнительные цвета
Специфичные цвета для определенных элементов
- `label` - цвет меток
- `value` - цвет значений
- `checkboxAccent` - цвет чекбоксов
- `focusRing` - цвет кольца фокуса

### 12. Тени и оверлеи
- `overlay`, `overlayLight` - оверлеи для модальных окон
- `shadowColor` - базовый цвет тени
- `shadowPrimary`, `shadowPrimaryLight` - тени с primary цветом
- `shadowAccent`, `shadowAccentLight` - тени с accent цветом
- `shadowSecondary` - тень с secondary цветом

## Объединение похожих цветов

Похожие цвета объединены под одни переменные:

### Белый цвет
- `#ffffff` → `var(--russ-bg)` или `var(--russ-input-bg)` или `var(--russ-text-inverse)`

### Серые оттенки текста
- `#1f2937` → `var(--russ-text-primary)`
- `#374151` → `var(--russ-text-secondary)` или `var(--russ-input-text)`
- `#6b7280` → `var(--russ-text-tertiary)` или `var(--russ-input-placeholder)`
- `#9ca3af` → `var(--russ-text-quaternary)` или `var(--russ-neutral-light)`
- `#64748b` → `var(--russ-text-muted)`

### Серые оттенки фона
- `#f8fafc` → `var(--russ-bg-secondary)`
- `#f9fafb` → `var(--russ-bg-quaternary)`
- `#f3f4f6` → `var(--russ-bg-hover)` или `var(--russ-bg-disabled)` или `var(--russ-input-bg-disabled)`
- `#f1f5f9` → `var(--russ-bg-tertiary)`
- `#e5e7eb` → `var(--russ-border)` или `var(--russ-bg-active)`

### Синие оттенки (для fintech)
- `#213e89` → `var(--russ-primary)` или `var(--russ-value)`
- `#1b3170` → `var(--russ-primary-hover)` или `var(--russ-primary-light)`
- `#162954` → `var(--russ-primary-active)` или `var(--russ-primary-dark)`
- `#6366f1` → `var(--russ-secondary)` или `var(--russ-label)`
- `#2563eb` → `var(--russ-accent)` или `var(--russ-checkbox-accent)`
- `#3b82f6` → `var(--russ-accent-light)` или `var(--russ-input-border-focus)`
- `#1d4cd2` → используется в градиентах и тенях

### Цвета ошибок
- `#dc3545` → `var(--russ-error)`
- `#ef4444` → `var(--russ-input-error)`
- `#D60000` → `var(--russ-input-border-error)`
- `#ffd6d6` → `var(--russ-input-error-bg)`
- `#fee2e2` → `var(--russ-error-light)`
- `#991b1b` → `var(--russ-error-text)`

### Цвета успеха
- `#22c55e` → `var(--russ-success)`
- `#10b981` → используется в градиентах (rusaisklad)
- `#059669` → primary для rusaisklad
- `#d1fae5` → `var(--russ-success-light)`
- `#065f46` → `var(--russ-success-text)`
- `#34d399` → `var(--russ-success-border)`

## Правила использования

1. **Всегда используйте CSS переменные** вместо хардкодных цветов
2. **Выбирайте семантически правильную переменную** - не используйте `primary` там, где нужен `text-primary`
3. **Используйте правильную иерархию** - для текста используйте `text-primary`, `text-secondary` и т.д.
4. **Для инпутов используйте специализированные переменные** - `input-border`, `input-bg` и т.д.
5. **Для статусов используйте статусные цвета** - `success`, `error`, `warning`, `info`
6. **Для теней используйте переменные теней** - они автоматически адаптируются под тему

## Миграция существующих компонентов

При миграции компонентов:

1. Найдите все хардкодные цвета (`#...`, `rgb(...)`, `rgba(...)`)
2. Определите семантическое назначение цвета
3. Найдите соответствующую CSS переменную в справочнике
4. Замените хардкодный цвет на переменную
5. Проверьте, что компонент работает с обеими темами

## Примеры миграции

См. файл `MIGRATION.md` для подробных примеров миграции компонентов.
