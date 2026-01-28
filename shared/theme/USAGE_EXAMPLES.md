# Примеры использования системы тем

## Для проекта fintech

### 1. Добавить CSS в nuxt.config.ts

```typescript
export default defineNuxtConfig({
  css: [
    '@russ-ui/bibli/shared/theme/theme.css'
  ],
  // ... остальная конфигурация
})
```

### 2. Установить тему в app.vue

```vue
<script setup lang="ts">
import { useTheme } from '@russ-ui/bibli/shared/theme'
import { useToast } from 'primevue/usetoast'
// ... другие импорты

// Установить тему fintech (синяя)
useTheme('fintech')

// ... остальной код
</script>
```

## Для проекта rusaisklad_front

### 1. Добавить CSS в nuxt.config.ts

```typescript
export default defineNuxtConfig({
  css: [
    '@russ-ui/bibli/shared/theme/theme.css'
  ],
  // ... остальная конфигурация
})
```

### 2. Установить тему в app.vue

```vue
<script setup lang="ts">
import { useTheme } from '@russ-ui/bibli/shared/theme'
import { useToast } from 'primevue/usetoast'
// ... другие импорты

// Установить тему rusaisklad (зеленая)
useTheme('rusaisklad')

// ... остальной код
</script>
```

## Динамическое переключение тем

Если нужно переключать темы во время выполнения:

```vue
<script setup>
import { useTheme } from '@russ-ui/bibli/shared/theme'
import { ref } from 'vue'

const { themeName, setTheme } = useTheme('fintech')

function toggleTheme() {
  const newTheme = themeName.value === 'fintech' ? 'rusaisklad' : 'fintech'
  setTheme(newTheme)
}
</script>

<template>
  <button @click="toggleTheme">
    Текущая тема: {{ themeName }}
  </button>
</template>
```

## Использование цветов в компонентах проекта

В ваших собственных компонентах проектов также можно использовать CSS переменные:

```vue
<style scoped>
.my-component {
  background-color: var(--russ-bg);
  color: var(--russ-text-primary);
  border: 1px solid var(--russ-border);
}

.my-button {
  background-color: var(--russ-primary);
  color: var(--russ-text-inverse);
}

.my-button:hover {
  background-color: var(--russ-primary-hover);
}
</style>
```

## Программный доступ к цветам

Если нужно получить цвет программно:

```vue
<script setup>
import { useTheme } from '@russ-ui/bibli/shared/theme'

const { colors } = useTheme('fintech')

// Использовать цвет в JavaScript
const primaryColor = colors.value.primary // '#213e89'
</script>
```
