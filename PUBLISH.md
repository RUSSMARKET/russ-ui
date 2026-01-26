# Инструкция по публикации библиотеки

## Подготовка к публикации

1. Убедитесь, что все изменения закоммичены:
   ```bash
   git status
   git add .
   git commit -m "chore: подготовка к публикации v1.0.0"
   ```

2. Создайте Git-репозиторий (если еще не создан):
   ```bash
   git init
   git remote add origin https://github.com/russ-ui/bibli.git
   ```

## Публикация версии

### Шаг 1: Обновите версию в package.json

Измените версию в `package.json`:
```json
{
  "version": "1.0.0"  // или 1.0.1, 1.1.0, 2.0.0 и т.д.
}
```

### Шаг 2: Закоммитьте изменения

```bash
git add package.json
git commit -m "chore: версия 1.0.0"
```

### Шаг 3: Создайте Git-тег

```bash
# Создать тег
git tag v1.0.0

# Отправить тег в репозиторий
git push origin v1.0.0

# Или отправить все теги
git push origin --tags
```

### Шаг 4: Отправьте изменения в репозиторий

```bash
git push origin main
# или
git push origin master
```

## Использование в других проектах

После публикации тега, в другом проекте добавьте зависимость:

```json
{
  "dependencies": {
    "@russ-ui/bibli": "git+https://github.com/russ-ui/bibli.git#v1.0.0"
  }
}
```

Затем установите:
```bash
npm install
```

## Обновление библиотеки

### Для разработчика библиотеки:

1. Внесите изменения
2. Обновите версию в `package.json` (согласно semver)
3. Закоммитьте:
   ```bash
   git add .
   git commit -m "feat: описание изменений"
   ```
4. Создайте новый тег:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   git push origin main
   ```

### Для пользователя библиотеки:

1. Обновите версию в `package.json`:
   ```json
   {
     "dependencies": {
       "@russ-ui/bibli": "git+https://github.com/russ-ui/bibli.git#v1.0.1"
     }
   }
   ```

2. Установите обновление:
   ```bash
   npm install
   # или
   npm update @russ-ui/bibli
   ```

## Семантическое версионирование

- **MAJOR** (2.0.0) - несовместимые изменения API
- **MINOR** (1.1.0) - новая функциональность с обратной совместимостью
- **PATCH** (1.0.1) - исправления ошибок

## Проверка тегов

Посмотреть все теги:
```bash
git tag
```

Посмотреть информацию о теге:
```bash
git show v1.0.0
```

Удалить тег (если нужно):
```bash
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```
