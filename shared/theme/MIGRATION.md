# Миграция компонентов на систему тем

Это руководство поможет мигрировать существующие компоненты с хардкодных цветов на CSS переменные.

## Таблица замены цветов

| Старый цвет | CSS переменная | Описание |
|------------|----------------|----------|
| `#213e89` | `var(--russ-primary)` | Основной цвет |
| `#1b3170` | `var(--russ-primary-hover)` | Основной цвет при наведении |
| `#162954` | `var(--russ-primary-active)` | Основной цвет при активации |
| `#6366f1` | `var(--russ-secondary)` или `var(--russ-label)` | Вторичный цвет / цвет меток |
| `#2563eb` | `var(--russ-accent)` или `var(--russ-checkbox-accent)` | Акцентный цвет |
| `#ffffff` | `var(--russ-bg)` или `var(--russ-text-inverse)` | Белый фон / инвертированный текст |
| `#1f2937` | `var(--russ-text-primary)` | Основной текст |
| `#374151` | `var(--russ-text-secondary)` | Вторичный текст |
| `#6b7280` | `var(--russ-text-tertiary)` | Третичный текст |
| `#e5e7eb` | `var(--russ-border)` | Границы |
| `#e2e8f0` | `var(--russ-border-light)` | Светлые границы |
| `#dc3545` | `var(--russ-error)` | Ошибки |
| `#22c55e` | `var(--russ-success)` | Успех |
| `#f59e0b` | `var(--russ-warning)` | Предупреждения |
| `#3b82f6` | `var(--russ-info)` | Информация |

## Примеры миграции

### Пример 1: Кнопка

**Было:**
```css
.button {
  background-color: #213e89;
  color: #ffffff;
}

.button:hover {
  background-color: #1b3170;
}
```

**Стало:**
```css
.button {
  background-color: var(--russ-primary);
  color: var(--russ-text-inverse);
}

.button:hover {
  background-color: var(--russ-primary-hover);
}
```

### Пример 2: Текст и метки

**Было:**
```css
.label {
  color: #6366f1;
}

.value {
  color: #213e89;
}

.text {
  color: #374151;
}
```

**Стало:**
```css
.label {
  color: var(--russ-label);
}

.value {
  color: var(--russ-value);
}

.text {
  color: var(--russ-text-secondary);
}
```

### Пример 3: Границы

**Было:**
```css
.border {
  border: 1px solid #e5e7eb;
}
```

**Стало:**
```css
.border {
  border: 1px solid var(--russ-border);
}
```

### Пример 4: Статусные цвета

**Было:**
```css
.success {
  background: #e0fbe0;
  color: #22c55e;
  border: 1px solid #22c55e;
}

.error {
  background: #fee2e2;
  color: #dc3545;
  border: 1px solid #dc3545;
}
```

**Стало:**
```css
.success {
  background: var(--russ-success-light);
  color: var(--russ-success);
  border: 1px solid var(--russ-success);
}

.error {
  background: var(--russ-error-light);
  color: var(--russ-error);
  border: 1px solid var(--russ-error);
}
```

### Пример 5: Фокус и активные состояния

**Было:**
```css
.input:focus {
  box-shadow: 0 0 0 2px rgba(33, 62, 137, 0.2);
}

.checkbox {
  accent-color: #2563eb;
}
```

**Стало:**
```css
.input:focus {
  box-shadow: 0 0 0 2px var(--russ-focus-ring);
}

.checkbox {
  accent-color: var(--russ-checkbox-accent);
}
```

## Поиск и замена

Для быстрой миграции можно использовать поиск и замену в редакторе:

1. `#213e89` → `var(--russ-primary)`
2. `#6366f1` → `var(--russ-secondary)` или `var(--russ-label)` (в зависимости от контекста)
3. `#2563eb` → `var(--russ-accent)` или `var(--russ-checkbox-accent)`
4. `#ffffff` → `var(--russ-bg)` или `var(--russ-text-inverse)` (в зависимости от контекста)
5. `#e5e7eb` → `var(--russ-border)`
6. `#dc3545` → `var(--russ-error)`
7. `#22c55e` → `var(--russ-success)`

**Важно:** Всегда проверяйте контекст использования цвета перед заменой!

## Проверка миграции

После миграции компонента:

1. Убедитесь, что CSS переменные определены (импортирован `theme.css`)
2. Проверьте, что тема установлена в приложении
3. Протестируйте компонент с разными темами (`fintech` и `rusaisklad`)
4. Убедитесь, что все состояния (hover, active, focus) работают корректно
