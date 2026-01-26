# Инструкция по обновлению библиотеки @russ-ui/bibli

## Для разработчика библиотеки (создание новой версии)

### Шаг 1: Внесите изменения в код

Внесите необходимые изменения в код библиотеки.

### Шаг 2: Обновите версию в package.json

Измените версию согласно [семантическому версионированию](https://semver.org/):

- **PATCH** (1.0.0 → 1.0.1) - исправления ошибок, обратно совместимые
- **MINOR** (1.0.0 → 1.1.0) - новая функциональность, обратно совместимая
- **MAJOR** (1.0.0 → 2.0.0) - несовместимые изменения API

```json
{
  "version": "1.0.1"
}
```

### Шаг 3: Закоммитьте изменения

```bash
git add .
git commit -m "feat: описание изменений"
git push
```

### Шаг 4: Создайте Git-тег

```bash
# Создать тег для новой версии
git tag v1.0.1

# Отправить тег в репозиторий
git push origin v1.0.1

# Или отправить все теги
git push origin --tags
```

### Шаг 5: Проверьте тег

Убедитесь, что тег создан:
- https://github.com/RUSSMARKET/russ-ui/releases
- https://github.com/RUSSMARKET/russ-ui/releases/tag/v1.0.1

## Для пользователя библиотеки (обновление до новой версии)

### Способ 1: Обновление до конкретной версии

1. Обновите версию в `package.json` вашего проекта:

```json
{
  "dependencies": {
    "@russ-ui/bibli": "git+https://github.com/RUSSMARKET/russ-ui.git#v1.0.1"
  }
}
```

2. Удалите старую версию и установите новую:

```bash
# Удалить node_modules и package-lock.json
rm -rf node_modules package-lock.json

# Или на Windows PowerShell
Remove-Item -Recurse -Force node_modules, package-lock.json

# Установить заново
npm install
```

### Способ 2: Обновление до последней версии из ветки main

Если хотите использовать последний код из ветки main (не рекомендуется для production):

```json
{
  "dependencies": {
    "@russ-ui/bibli": "git+https://github.com/RUSSMARKET/russ-ui.git#main"
  }
}
```

Затем:

```bash
npm install
```

### Способ 3: Обновление через npm update

Если используете конкретную версию, можно попробовать:

```bash
npm update @russ-ui/bibli
```

**Важно:** npm может кэшировать Git-зависимости. Если обновление не работает:

```bash
# Очистить кэш npm
npm cache clean --force

# Удалить и переустановить
rm -rf node_modules package-lock.json
npm install
```

## Проверка текущей версии

Чтобы узнать, какая версия установлена:

```bash
# Посмотреть в package.json
cat package.json | grep "@russ-ui/bibli"

# Или через npm
npm list @russ-ui/bibli
```

## Доступные версии

Все доступные версии (теги) можно посмотреть:
- В репозитории: https://github.com/RUSSMARKET/russ-ui/releases
- Через Git: `git ls-remote --tags https://github.com/RUSSMARKET/russ-ui.git`

## Рекомендации

1. **Для production** - всегда используйте конкретную версию с тегом (например, `#v1.0.1`)
2. **Для разработки** - можно использовать `#main` для получения последних изменений
3. **Перед обновлением** - проверьте [CHANGELOG.md](./CHANGELOG.md) или историю коммитов на предмет breaking changes
4. **После обновления** - проверьте, что приложение работает корректно

## Решение проблем

### Проблема: npm не обновляет библиотеку

**Решение:**
```bash
# Очистить кэш
npm cache clean --force

# Удалить библиотеку из node_modules
rm -rf node_modules/@russ-ui

# Переустановить
npm install
```

### Проблема: Ошибка "Repository not found"

**Решение:** Убедитесь, что используете правильный URL:
```
git+https://github.com/RUSSMARKET/russ-ui.git#v1.0.1
```

### Проблема: Конфликты версий

**Решение:** Убедитесь, что все зависимости совместимы. Проверьте `peerDependencies` в документации библиотеки.
