# Руководство по массовой миграции цветов

## Статус миграции

✅ **Завершено:**
- Все компоненты `inputs/` (text, password, phone, code, passport, date)
- Компоненты `profile/` (ProfileStepPassport, ProfileStepContacts, ProfileSectionEmail, ProfileSectionPassport, ProfileSectionContacts, ProfileSectionType, ProfileSectionPhotos, PhotoModal, FilePreview)
- SearchInput
- Notification
- BaseModal

🔄 **В процессе:**
- Остальные модальные окна
- Остальные компоненты

## Массовые замены для оставшихся компонентов

Используйте поиск и замену в вашем редакторе для следующих паттернов:

### Основные цвета
- `#213e89` → `var(--russ-primary)` или `var(--russ-value)`
- `#1b3170` → `var(--russ-primary-hover)` или `var(--russ-primary-light)`
- `#162954` → `var(--russ-primary-active)` или `var(--russ-primary-dark)`
- `#6366f1` → `var(--russ-secondary)` или `var(--russ-label)`
- `#2563eb` → `var(--russ-accent)` или `var(--russ-checkbox-accent)`
- `#3b82f6` → `var(--russ-accent-light)` или `var(--russ-input-border-focus)`
- `#1d4cd2` → используется в градиентах (заменить на `var(--russ-accent)`)

### Текст
- `#1f2937` → `var(--russ-text-primary)`
- `#374151` → `var(--russ-text-secondary)` или `var(--russ-input-text)`
- `#6b7280` → `var(--russ-text-tertiary)` или `var(--russ-input-placeholder)`
- `#9ca3af` → `var(--russ-text-quaternary)` или `var(--russ-neutral-light)`
- `#64748b` → `var(--russ-text-muted)`
- `#333` → `var(--russ-text-primary)`
- `#666` → `var(--russ-text-tertiary)`
- `#000` → `var(--russ-text-primary)`

### Фоны
- `#ffffff` → `var(--russ-bg)` или `var(--russ-input-bg)`
- `#f8fafc` → `var(--russ-bg-secondary)`
- `#f9fafb` → `var(--russ-bg-quaternary)`
- `#f3f4f6` → `var(--russ-bg-hover)` или `var(--russ-bg-disabled)` или `var(--russ-input-bg-disabled)`
- `#f1f5f9` → `var(--russ-bg-tertiary)`
- `#e5e7eb` → `var(--russ-border)` или `var(--russ-bg-active)`
- `#e8edff` → `var(--russ-bg-blue-tint)`
- `#f5f7ff` → `var(--russ-bg-blue-light)`
- `#e0e7ff` → `var(--russ-bg-blue-lighter)`
- `#f4f7fb` → `var(--russ-bg-gray-light)`

### Границы
- `#e5e7eb` → `var(--russ-border)`
- `#e2e8f0` → `var(--russ-border-light)`
- `#e3e8f0` → `var(--russ-border-light)`
- `#d1d5db` → `var(--russ-border-dark)`
- `#ced4da` → `var(--russ-input-border)` или `var(--russ-border-quaternary)`
- `#cbd5e1` → `var(--russ-border-light)`
- `#d4ddff` → `var(--russ-bg-blue-lighter)`

### Ошибки
- `#dc3545` → `var(--russ-error)`
- `#ef4444` → `var(--russ-input-error)`
- `#D60000` → `var(--russ-input-border-error)`
- `#ffd6d6` → `var(--russ-input-error-bg)`
- `#fee2e2` → `var(--russ-error-light)`
- `#991b1b` → `var(--russ-error-text)`
- `#f44336` → `var(--russ-error)`

### Успех
- `#22c55e` → `var(--russ-success)`
- `#10b981` → используется в градиентах (заменить на `var(--russ-success)`)
- `#059669` → primary для rusaisklad
- `#d1fae5` → `var(--russ-success-light)`
- `#065f46` → `var(--russ-success-text)`
- `#34d399` → `var(--russ-success-border)`
- `#4CAF50` → `var(--russ-success)`

### Предупреждения
- `#f59e0b` → `var(--russ-warning)`
- `#fef3c7` → `var(--russ-warning-light)`
- `#92400e` → `var(--russ-warning-text)`
- `#ff9800` → `var(--russ-warning)`

### Информация
- `#3b82f6` → `var(--russ-info)` или `var(--russ-accent-light)`
- `#2196F3` → `var(--russ-info)`
- `#dbeafe` → `var(--russ-info-light)`
- `#1e40af` → `var(--russ-info-text)`
- `#bfdbfe` → `var(--russ-info-border)`

### Тени и оверлеи
- `rgba(0, 0, 0, 0.5)` → `var(--russ-overlay)`
- `rgba(0, 0, 0, 0.3)` → `var(--russ-overlay-light)`
- `rgba(0, 0, 0, 0.1)` → `var(--russ-shadow-color)`
- `rgba(33, 62, 137, 0.1)` → `var(--russ-shadow-primary)`
- `rgba(33, 62, 137, 0.06)` → `var(--russ-shadow-primary-light)`
- `rgba(33, 62, 137, 0.13)` → `var(--russ-shadow-primary)`
- `rgba(37, 99, 235, 0.2)` → `var(--russ-shadow-accent)` или `var(--russ-focus-ring)`
- `rgba(37, 99, 235, 0.1)` → `var(--russ-shadow-accent-light)`
- `rgba(99, 102, 241, 0.1)` → `var(--russ-shadow-secondary)`
- `rgba(29, 76, 210, 0.05)` → `var(--russ-accent-tint-12)`
- `rgba(29, 76, 210, 0.12)` → `var(--russ-accent-tint-12)`
- `rgba(29, 76, 210, 0.18)` → `var(--russ-accent-tint-18)`
- `rgba(29, 76, 210, 0.4)` → `var(--russ-accent-tint-40)`

### Специальные цвета
- `#fed521` → `var(--russ-yellow)`
- `#fff3cd` → `var(--russ-yellow-light)`
- `#f39c12` → `var(--russ-orange)`
- `#ffeaa7` → `var(--russ-orange-light)`
- `#8b5cf6` → `var(--russ-purple)`
- `#e0e7ff` → `var(--russ-purple-light)`

## Проверка после миграции

После замены цветов проверьте:
1. Компонент работает с темой `fintech`
2. Компонент работает с темой `rusaisklad`
3. Все состояния (hover, active, focus, disabled) работают корректно
4. Нет визуальных артефактов

## Автоматизация

Для массовой миграции можно использовать регулярные выражения в редакторе:

**Поиск:** `#([0-9a-fA-F]{6})`  
**Замена:** Используйте таблицу выше для каждого найденного цвета

Или используйте скрипт для автоматической замены (см. примеры в документации).
