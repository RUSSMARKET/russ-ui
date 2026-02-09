/**
 * Нормализует строку для поиска: приводит к нижнему регистру и заменяет ё на е
 * 
 * @param str Строка для нормализации
 * @returns Нормализованная строка
 */
function normalizeString(str: string): string {
  return str.toLowerCase().replace(/ё/g, 'е').trim();
}

/**
 * Разбивает строку на n-граммы (биграммы по умолчанию)
 * Например: "привет" -> ["пр", "ри", "ив", "ве", "ет"]
 * 
 * @param str Строка для разбиения
 * @param n Размер n-граммы (по умолчанию 2)
 * @returns Массив n-грамм
 */
function getNGrams(str: string, n: number = 2): string[] {
  if (str.length < n) {
    return [str];
  }
  const ngrams: string[] = [];
  for (let i = 0; i <= str.length - n; i++) {
    ngrams.push(str.slice(i, i + n));
  }
  return ngrams;
}

/**
 * Вычисляет коэффициент схожести на основе пересечения n-грамм (как в Elasticsearch)
 * 
 * @param str1 Первая строка
 * @param str2 Вторая строка
 * @param ngramSize Размер n-граммы (по умолчанию 2)
 * @returns Коэффициент схожести от 0 до 1
 */
function ngramSimilarity(str1: string, str2: string, ngramSize: number = 2): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);
  
  // Если одна из строк пустая
  if (!normalized1 || !normalized2) {
    return normalized1 === normalized2 ? 1 : 0;
  }
  
  // Точное совпадение
  if (normalized1 === normalized2) {
    return 1;
  }
  
  // Проверка подстроки (быстрая проверка)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    const minLen = Math.min(normalized1.length, normalized2.length);
    const maxLen = Math.max(normalized1.length, normalized2.length);
    return minLen / maxLen;
  }
  
  // Получаем n-граммы
  const ngrams1 = new Set(getNGrams(normalized1, ngramSize));
  const ngrams2 = new Set(getNGrams(normalized2, ngramSize));
  
  // Вычисляем пересечение
  let intersection = 0;
  for (const ngram of ngrams1) {
    if (ngrams2.has(ngram)) {
      intersection++;
    }
  }
  
  // Если нет пересечений, возвращаем 0
  if (intersection === 0) {
    return 0;
  }
  
  // Коэффициент Жаккара (Jaccard similarity) - как в Elasticsearch
  const union = ngrams1.size + ngrams2.size - intersection;
  const jaccard = intersection / union;
  
  // Дополнительно учитываем длину строк для лучшего ранжирования
  const lengthRatio = Math.min(normalized1.length, normalized2.length) / Math.max(normalized1.length, normalized2.length);
  
  // Комбинируем коэффициент Жаккара и отношение длин
  return jaccard * 0.7 + lengthRatio * 0.3;
}

/**
 * Вычисляет расстояние Левенштейна между двумя строками
 * Расстояние Левенштейна - минимальное количество операций вставки, удаления и замены символов,
 * необходимое для преобразования одной строки в другую
 * 
 * @param str1 Первая строка
 * @param str2 Вторая строка
 * @returns Расстояние Левенштейна между строками
 */
export function levenshteinDistance(str1: string, str2: string): number {
  // Нормализуем строки для сравнения (ё -> е)
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);
  
  const len1 = normalized1.length;
  const len2 = normalized2.length;

  // Создаем матрицу для динамического программирования
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Инициализация первой строки и первого столбца
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Заполнение матрицы
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      // Сравниваем нормализованные символы
      const char1 = normalized1[i - 1];
      const char2 = normalized2[j - 1];
      const cost = char1 === char2 ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // удаление
        matrix[i][j - 1] + 1,      // вставка
        matrix[i - 1][j - 1] + cost // замена
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Вычисляет нормализованное расстояние Левенштейна (от 0 до 1)
 * 0 означает полное совпадение, 1 - полное несовпадение
 * 
 * @param str1 Первая строка
 * @param str2 Вторая строка
 * @returns Нормализованное расстояние от 0 до 1
 */
export function normalizedLevenshteinDistance(str1: string, str2: string): number {
  // levenshteinDistance уже нормализует строки внутри себя
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);
  const maxLen = Math.max(normalized1.length, normalized2.length);
  if (maxLen === 0) return 0;
  
  // Используем уже нормализованные строки напрямую для вычисления расстояния
  const len1 = normalized1.length;
  const len2 = normalized2.length;
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const char1 = normalized1[i - 1];
      const char2 = normalized2[j - 1];
      const cost = char1 === char2 ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[len1][len2];
  return distance / maxLen;
}

/**
 * Вычисляет коэффициент схожести (от 0 до 1)
 * 1 означает полное совпадение, 0 - полное несовпадение
 * Использует комбинацию n-gram поиска и расстояния Левенштейна
 * 
 * @param str1 Первая строка
 * @param str2 Вторая строка
 * @returns Коэффициент схожести от 0 до 1
 */
export function similarity(str1: string, str2: string): number {
  // Используем n-gram поиск как основной метод (как в Elasticsearch)
  const ngramSim = ngramSimilarity(str1, str2, 2);
  
  // Дополнительно используем расстояние Левенштейна для точности
  const levenshteinSim = 1 - normalizedLevenshteinDistance(str1, str2);
  
  // Комбинируем оба метода: n-gram дает лучшие результаты для частичных совпадений
  return ngramSim * 0.7 + levenshteinSim * 0.3;
}

/**
 * Проверяет, соответствует ли строка поисковому запросу с учетом расстояния Левенштейна
 * 
 * @param text Текст для проверки
 * @param query Поисковый запрос
 * @param threshold Порог схожести (от 0 до 1). По умолчанию 0.5 (50% схожести)
 * @param maxDistance Максимальное расстояние Левенштейна. Если задано, используется вместо threshold
 * @returns true, если текст соответствует запросу
 */
export function fuzzyMatch(
  text: string,
  query: string,
  threshold: number = 0.5,
  maxDistance?: number
): boolean {
  if (!query.trim()) return true;
  if (!text.trim()) return false;

  // Нормализуем строки (ё -> е, нижний регистр)
  const normalizedText = normalizeString(text);
  const normalizedQuery = normalizeString(query);

  // Точное совпадение (включая подстроку) - максимальный приоритет
  if (normalizedText.includes(normalizedQuery)) {
    return true;
  }

  // Если запрос длиннее текста, проверяем наоборот
  if (normalizedQuery.length > normalizedText.length) {
    if (normalizedQuery.includes(normalizedText)) {
      return true;
    }
  }

  // Используем максимальное расстояние, если задано
  if (maxDistance !== undefined) {
    const distance = levenshteinDistance(normalizedText, normalizedQuery);
    return distance <= maxDistance;
  }

  // Используем n-gram поиск (как в Elasticsearch) для лучших результатов
  const sim = ngramSimilarity(normalizedText, normalizedQuery, 2);
  return sim >= threshold;
}

/**
 * Находит все элементы в массиве, которые соответствуют поисковому запросу
 * с учетом расстояния Левенштейна
 * 
 * @param items Массив элементов для поиска
 * @param query Поисковый запрос
 * @param getText Функция для получения текста из элемента
 * @param threshold Порог схожести (от 0 до 1). По умолчанию 0.5
 * @param maxDistance Максимальное расстояние Левенштейна. Если задано, используется вместо threshold
 * @returns Отфильтрованный массив элементов, отсортированный по релевантности
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  getText: (item: T) => string | string[],
  threshold: number = 0.5,
  maxDistance?: number
): T[] {
  if (!query.trim()) {
    return items;
  }

  const normalizedQuery = normalizeString(query);
  const results: Array<{ item: T; score: number; distance: number }> = [];

  for (const item of items) {
    const texts = Array.isArray(getText(item)) 
      ? (getText(item) as string[])
      : [getText(item) as string];

    let bestScore = 0;
    let bestDistance = Infinity;

    for (const text of texts) {
      if (!text) continue;

      const normalizedText = normalizeString(String(text));

      // Проверка точного совпадения (включая подстроку) - максимальный приоритет
      if (normalizedText.includes(normalizedQuery)) {
        const exactMatchScore = normalizedQuery.length / normalizedText.length;
        if (exactMatchScore > bestScore) {
          bestScore = exactMatchScore;
          bestDistance = 0;
        }
        continue;
      }

      // Если запрос длиннее текста, проверяем наоборот
      if (normalizedQuery.length > normalizedText.length && normalizedText.includes(normalizedQuery)) {
        bestScore = 1;
        bestDistance = 0;
        continue;
      }

      // Используем n-gram поиск для вычисления схожести (как в Elasticsearch)
      const score = ngramSimilarity(normalizedText, normalizedQuery, 2);
      
      // Вычисляем расстояние для сортировки
      const distance = levenshteinDistance(normalizedText, normalizedQuery);

      // Если используется maxDistance, проверяем его
      if (maxDistance !== undefined) {
        if (distance <= maxDistance && score > bestScore) {
          bestScore = score;
          bestDistance = distance;
        }
      } else {
        // Используем threshold
        if (score >= threshold && score > bestScore) {
          bestScore = score;
          bestDistance = distance;
        }
      }
    }

    if (bestScore > 0) {
      results.push({ item, score: bestScore, distance: bestDistance });
    }
  }

  // Сортируем по релевантности (сначала по score, потом по distance)
  results.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.001) {
      return a.distance - b.distance;
    }
    return b.score - a.score;
  });

  return results.map(r => r.item);
}

/**
 * Проверяет, соответствует ли текст поисковому запросу (простая функция для замены includes)
 * Использует расстояние Левенштейна с разумными порогами по умолчанию
 * 
 * @param text Текст для проверки
 * @param query Поисковый запрос
 * @returns true, если текст соответствует запросу
 */
export function fuzzyIncludes(text: string, query: string): boolean {
  return fuzzyMatch(text, query, 0.3); // Более мягкий порог для обратной совместимости
}
