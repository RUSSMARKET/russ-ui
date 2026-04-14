/**
 * Нормализует строку для поиска: приводит к нижнему регистру, заменяет ё на е
 * и убирает лишние пробелы.
 */
function normalizeString(str: string): string {
  return str
    .normalize("NFKC")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

function clampThreshold(threshold: number): number {
  if (Number.isNaN(threshold)) return 0.5;
  return Math.min(1, Math.max(0, threshold));
}

function getNGrams(str: string, n: number = 2): string[] {
  if (!str) return [];
  if (str.length < n) return [str];

  const ngrams: string[] = [];
  for (let i = 0; i <= str.length - n; i++) {
    ngrams.push(str.slice(i, i + n));
  }
  return ngrams;
}

function calculateLevenshteinDistance(str1: string, str2: string): number {
  const chars1 = Array.from(str1);
  const chars2 = Array.from(str2);

  if (chars1.length === 0) return chars2.length;
  if (chars2.length === 0) return chars1.length;

  let previous = Array.from({ length: chars2.length + 1 }, (_, index) => index);
  let current = new Array<number>(chars2.length + 1);

  for (let i = 1; i <= chars1.length; i++) {
    current[0] = i;

    for (let j = 1; j <= chars2.length; j++) {
      const cost = chars1[i - 1] === chars2[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      );
    }

    [previous, current] = [current, previous];
  }

  return previous[chars2.length];
}

function ngramSimilarity(str1: string, str2: string, ngramSize: number = 2): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  if (!normalized1 || !normalized2) {
    return normalized1 === normalized2 ? 1 : 0;
  }

  if (normalized1 === normalized2) return 1;

  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return Math.min(normalized1.length, normalized2.length) /
      Math.max(normalized1.length, normalized2.length);
  }

  const ngrams1 = new Set(getNGrams(normalized1, ngramSize));
  const ngrams2 = new Set(getNGrams(normalized2, ngramSize));

  let intersection = 0;
  for (const ngram of ngrams1) {
    if (ngrams2.has(ngram)) intersection++;
  }

  if (intersection === 0) return 0;

  const union = ngrams1.size + ngrams2.size - intersection;
  const jaccard = intersection / union;
  const lengthRatio = Math.min(normalized1.length, normalized2.length) /
    Math.max(normalized1.length, normalized2.length);

  return jaccard * 0.7 + lengthRatio * 0.3;
}

function getEffectiveThreshold(queryLength: number, threshold: number): number {
  const normalizedThreshold = clampThreshold(threshold);

  if (queryLength <= 2) return 1;
  if (queryLength <= 4) return Math.max(normalizedThreshold, 0.55);
  return Math.max(normalizedThreshold, 0.45);
}

function getAllowedDistance(queryLength: number): number {
  if (queryLength <= 2) return 0;
  if (queryLength <= 5) return 1;
  if (queryLength <= 10) return 2;
  return Math.max(2, Math.floor(queryLength * 0.25));
}

function getMatchScore(
  text: string,
  query: string,
  threshold: number,
  maxDistance?: number
): { matched: boolean; score: number; distance: number } {
  const normalizedText = normalizeString(text);
  const normalizedQuery = normalizeString(query);

  if (!normalizedQuery) {
    return { matched: true, score: 1, distance: 0 };
  }
  if (!normalizedText) {
    return { matched: false, score: 0, distance: Infinity };
  }

  if (normalizedText === normalizedQuery) {
    return { matched: true, score: 1, distance: 0 };
  }

  if (normalizedText.includes(normalizedQuery)) {
    const score = Math.max(0.6, normalizedQuery.length / normalizedText.length);
    return { matched: true, score, distance: 0 };
  }

  const textParts = normalizedText.split(" ").filter(Boolean);
  const queryParts = normalizedQuery.split(" ").filter(Boolean);

  if (queryParts.length === 1 && textParts.length > 1) {
    let bestPartMatch = { matched: false, score: 0, distance: Infinity };

    for (const part of textParts) {
      const partMatch = getMatchScore(part, normalizedQuery, threshold, maxDistance);
      if (
        partMatch.matched &&
        (partMatch.score > bestPartMatch.score ||
          (Math.abs(partMatch.score - bestPartMatch.score) < 0.001 &&
            partMatch.distance < bestPartMatch.distance))
      ) {
        bestPartMatch = partMatch;
      }
    }

    if (bestPartMatch.matched) return bestPartMatch;
  }

  if (queryParts.length > 1 && textParts.length > 1) {
    const tokenMatches = queryParts.map((queryPart) => {
      let bestTokenMatch = { matched: false, score: 0, distance: Infinity };

      for (const textPart of textParts) {
        const tokenMatch = getMatchScore(textPart, queryPart, threshold, maxDistance);
        if (
          tokenMatch.matched &&
          (tokenMatch.score > bestTokenMatch.score ||
            (Math.abs(tokenMatch.score - bestTokenMatch.score) < 0.001 &&
              tokenMatch.distance < bestTokenMatch.distance))
        ) {
          bestTokenMatch = tokenMatch;
        }
      }

      return bestTokenMatch;
    });

    if (tokenMatches.every((match) => match.matched)) {
      const score = tokenMatches.reduce((sum, match) => sum + match.score, 0) /
        tokenMatches.length;
      const distance = tokenMatches.reduce((sum, match) => sum + match.distance, 0);

      return { matched: true, score, distance };
    }
  }

  const distance = calculateLevenshteinDistance(normalizedText, normalizedQuery);
  const maxLength = Math.max(normalizedText.length, normalizedQuery.length);
  const minLength = Math.min(normalizedText.length, normalizedQuery.length);
  const lengthRatio = minLength / maxLength;
  const levenshteinScore = 1 - distance / maxLength;

  if (maxDistance !== undefined) {
    const matched = distance <= maxDistance;
    return { matched, score: matched ? levenshteinScore : 0, distance };
  }

  if (
    lengthRatio >= 0.65 &&
    distance <= getAllowedDistance(normalizedQuery.length) &&
    levenshteinScore >= getEffectiveThreshold(normalizedQuery.length, threshold)
  ) {
    return { matched: true, score: levenshteinScore, distance };
  }

  const ngramScore = ngramSimilarity(normalizedText, normalizedQuery, 2);
  const combinedScore = ngramScore * 0.7 + levenshteinScore * 0.3;
  const score = Math.max(ngramScore, combinedScore);
  const matched = score >= getEffectiveThreshold(normalizedQuery.length, threshold);

  return { matched, score: matched ? score : 0, distance };
}

/**
 * Вычисляет расстояние Левенштейна между двумя строками.
 */
export function levenshteinDistance(str1: string, str2: string): number {
  return calculateLevenshteinDistance(normalizeString(str1), normalizeString(str2));
}

/**
 * Вычисляет нормализованное расстояние Левенштейна (от 0 до 1).
 * 0 означает полное совпадение, 1 - полное несовпадение.
 */
export function normalizedLevenshteinDistance(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);
  const maxLen = Math.max(normalized1.length, normalized2.length);

  if (maxLen === 0) return 0;

  return calculateLevenshteinDistance(normalized1, normalized2) / maxLen;
}

/**
 * Вычисляет коэффициент схожести (от 0 до 1).
 * 1 означает полное совпадение, 0 - полное несовпадение.
 */
export function similarity(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  if (!normalized1 || !normalized2) {
    return normalized1 === normalized2 ? 1 : 0;
  }

  const ngramScore = ngramSimilarity(normalized1, normalized2, 2);
  const levenshteinScore = 1 - normalizedLevenshteinDistance(normalized1, normalized2);

  return Math.max(0, Math.min(1, ngramScore * 0.7 + levenshteinScore * 0.3));
}

/**
 * Проверяет, соответствует ли строка поисковому запросу с учетом расстояния
 * Левенштейна и n-gram схожести.
 */
export function fuzzyMatch(
  text: string,
  query: string,
  threshold: number = 0.5,
  maxDistance?: number
): boolean {
  return getMatchScore(text, query, threshold, maxDistance).matched;
}

/**
 * Более строгий режим для select/search UI: оставляет точные вхождения,
 * но сильнее режет короткие и слабопохожие fuzzy-совпадения.
 */
export function strictFuzzyMatch(
  text: string,
  query: string,
  threshold: number = 0.7
): boolean {
  return getMatchScore(text, query, threshold).matched;
}

/** Нормализация ФИО для сравнения: регистр, ё, схлопывание пробелов. */
function normalizeFioForMatch(str: string): string {
  return normalizeString(str);
}

function tokenMatchesFioPart(
  token: string,
  parts: string[],
  fullText: string,
  threshold: number
): boolean {
  if (token.length <= 2) {
    return parts.some((part) => part.startsWith(token));
  }

  if (fullText.includes(token)) return true;

  return parts.some((part) =>
    part.includes(token) ||
    getMatchScore(part, token, Math.max(threshold, 0.45)).matched
  );
}

/**
 * Поиск по ФИО с учётом нескольких слов (логическое И по токенам).
 */
export function matchFioQuery(
  text: string,
  query: string,
  threshold: number = 0.3
): boolean {
  const normalizedQuery = normalizeFioForMatch(query);
  if (!normalizedQuery) return true;

  const normalizedText = normalizeFioForMatch(text);
  if (!normalizedText) return false;

  if (normalizedText.includes(normalizedQuery)) return true;

  const tokens = normalizedQuery.split(" ").filter(Boolean);
  const parts = normalizedText.split(" ").filter(Boolean);

  if (tokens.length === 1) {
    return tokenMatchesFioPart(tokens[0], parts, normalizedText, threshold);
  }

  return tokens.every((token) =>
    tokenMatchesFioPart(token, parts, normalizedText, threshold)
  );
}

/**
 * Находит все элементы в массиве, которые соответствуют поисковому запросу,
 * и сортирует их по релевантности.
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  getText: (item: T) => string | string[],
  threshold: number = 0.5,
  maxDistance?: number
): T[] {
  if (!query.trim()) return items;

  const results: Array<{ item: T; score: number; distance: number }> = [];

  for (const item of items) {
    const rawTexts = getText(item);
    const texts = Array.isArray(rawTexts) ? rawTexts : [rawTexts];

    let bestScore = 0;
    let bestDistance = Infinity;

    for (const text of texts) {
      if (!text) continue;

      const result = getMatchScore(String(text), query, threshold, maxDistance);

      if (
        result.matched &&
        (result.score > bestScore ||
          (Math.abs(result.score - bestScore) < 0.001 && result.distance < bestDistance))
      ) {
        bestScore = result.score;
        bestDistance = result.distance;
      }
    }

    if (bestScore > 0) {
      results.push({ item, score: bestScore, distance: bestDistance });
    }
  }

  results.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.001) {
      return a.distance - b.distance;
    }
    return b.score - a.score;
  });

  return results.map((result) => result.item);
}

/**
 * Простая функция для замены includes с учетом опечаток.
 */
export function fuzzyIncludes(text: string, query: string): boolean {
  return fuzzyMatch(text, query, 0.3);
}
