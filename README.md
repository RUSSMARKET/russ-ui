# @russ-ui/bibli

Библиотека общих UI компонентов, composables, API утилит и виджетов для Vue 3 проектов.

## Установка

### Через Git (рекомендуется)

```bash
npm install git+https://github.com/russ-ui/bibli.git#v1.0.0
```

Или добавьте в `package.json`:

```json
{
  "dependencies": {
    "@russ-ui/bibli": "git+https://github.com/russ-ui/bibli.git#v1.0.0"
  }
}
```

### Варианты установки

- **Конкретная версия**: `git+https://github.com/russ-ui/bibli.git#v1.0.0`
- **Последний коммит в ветке**: `git+https://github.com/russ-ui/bibli.git#main`
- **Конкретный коммит**: `git+https://github.com/russ-ui/bibli.git#abc1234`

## Обновление

1. Обновите версию в `package.json` вашего проекта:
   ```json
   {
     "dependencies": {
       "@russ-ui/bibli": "git+https://github.com/russ-ui/bibli.git#v1.0.1"
     }
   }
   ```

2. Выполните:
   ```bash
   npm install
   # или
   npm update @russ-ui/bibli
   ```

## Использование

### Полный импорт

```typescript
import { 
  // API
  http,
  fetchUserPages,
  
  // Composables
  useStories,
  useNavigation,
  useRoles,
  
  // UI Components
  BaseModal,
  SearchInput,
  DatePicker,
  
  // Widgets
  ClientRegistration,
  NotificationsPanel
} from '@russ-ui/bibli'
```

### Частичный импорт

```typescript
// Только API
import { http, fetchUserPages } from '@russ-ui/bibli/shared/api'

// Только composables
import { useStories, useNavigation } from '@russ-ui/bibli/shared/composables'

// Только UI компоненты
import { BaseModal, SearchInput } from '@russ-ui/bibli/shared/ui'

// Только утилиты
import { encryptData, decryptData } from '@russ-ui/bibli/shared/utils'

// Только виджеты
import { ClientRegistration } from '@russ-ui/bibli/widgets'
```

## Зависимости

### Peer Dependencies (обязательные)

- `vue` ^3.0.0
- `axios` ^1.0.0

### Peer Dependencies (опциональные)

- `primevue` ^3.0.0 || ^4.0.0
- `@fancyapps/ui` ^5.0.0
- `qrcode` ^1.5.0

Установите необходимые зависимости в вашем проекте:

```bash
npm install vue@^3.0.0 axios@^1.0.0
npm install primevue@^4.0.0 @fancyapps/ui@^5.0.0 qrcode@^1.5.0
```

## Важные замечания

### Внешние зависимости проекта

Некоторые части библиотеки требуют наличия в вашем проекте:

- `@/entities` - сущность `User` (для авторизации)
- `@/stores` или `~/stores` - stores (roles, projects, agents)
- Настроенные алиасы путей (`@/`, `~/`)

Убедитесь, что эти зависимости доступны в вашем проекте, или адаптируйте код под вашу структуру.

### Настройка алиасов

В вашем проекте должны быть настроены алиасы путей. Например, в `vite.config.ts` или `nuxt.config.ts`:

```typescript
// Vite
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '~': path.resolve(__dirname, './src')
  }
}

// Nuxt (автоматически)
```

## Структура библиотеки

```
@russ-ui/bibli/
├── shared/
│   ├── api/          # API функции и HTTP клиент
│   ├── composables/  # Vue composables
│   ├── ui/           # UI компоненты
│   └── utils/        # Утилиты
└── widgets/          # Виджеты (сложные компоненты)
```

## Версионирование

Библиотека использует [семантическое версионирование](https://semver.org/):

- `MAJOR` - несовместимые изменения API
- `MINOR` - новая функциональность с обратной совместимостью
- `PATCH` - исправления ошибок

## Разработка

### Создание новой версии

1. Внесите изменения в код
2. Обновите версию в `package.json`
3. Закоммитьте изменения:
   ```bash
   git add .
   git commit -m "feat: добавлена новая функциональность"
   ```
4. Создайте тег:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

## Лицензия

MIT
