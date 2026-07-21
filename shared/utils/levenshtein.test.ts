import { describe, expect, it } from "vitest";
import { matchFioQuery } from "./levenshtein";

describe("matchFioQuery strictness", () => {
  it("matches exact and substring FIO", () => {
    expect(matchFioQuery("Иванов Иван Иванович", "Иванов Иван Иванович")).toBe(
      true,
    );
    expect(matchFioQuery("Иванов Иван Иванович", "Иванов")).toBe(true);
  });

  it("matches phone-like short surname with small typo", () => {
    expect(matchFioQuery("Петров Пётр", "Петроф")).toBe(true);
  });

  it("does not match unrelated full FIO when query is another full name", () => {
    expect(
      matchFioQuery("Сидоров Алексей Петрович", "Иванов Иван Иванович"),
    ).toBe(false);
    expect(
      matchFioQuery("Козлов Дмитрий Сергеевич", "Иванов Иван Иванович"),
    ).toBe(false);
  });

  it("requires all tokens for multi-word queries", () => {
    expect(matchFioQuery("Иванов Иван Иванович", "Иванов Пётр")).toBe(false);
    expect(matchFioQuery("Иванов Иван Иванович", "Иванов Иван")).toBe(true);
  });
});
