import { describe, expect, it } from "@/lib/test-shim";
import { detectDelimiter, encodeCsv, parseCsv } from "@/lib/csv";

describe("parseCsv", () => {
  it("parses basic comma-delimited", () => {
    const r = parseCsv("a,b,c\n1,2,3\n4,5,6");
    expect(r.headers).toEqual(["a", "b", "c"]);
    expect(r.rows).toEqual([
      ["1", "2", "3"],
      ["4", "5", "6"],
    ]);
    expect(r.delimiter).toBe(",");
  });

  it("strips UTF-8 BOM", () => {
    const r = parseCsv("﻿long_url,title\nhttps://x.com,Hello");
    expect(r.headers[0]).toBe("long_url");
  });

  it("auto-detects semicolon delimiter (Excel EU)", () => {
    const r = parseCsv("col;val;n\na;1;100\nb;2;200");
    expect(r.delimiter).toBe(";");
    expect(r.headers).toEqual(["col", "val", "n"]);
    expect(r.rows[0]).toEqual(["a", "1", "100"]);
  });

  it("auto-detects tab delimiter", () => {
    const r = parseCsv("a\tb\n1\t2");
    expect(r.delimiter).toBe("\t");
    expect(r.headers).toEqual(["a", "b"]);
  });

  it("handles quoted commas inside cells", () => {
    const r = parseCsv('a,b\n"hello, world","x"');
    expect(r.rows[0]).toEqual(["hello, world", "x"]);
  });

  it("handles escaped double-quotes", () => {
    const r = parseCsv('a\n"she said ""hi"""');
    expect(r.rows[0]).toEqual(['she said "hi"']);
  });

  it("drops trailing empty rows", () => {
    const r = parseCsv("a,b\n1,2\n\n");
    expect(r.rows).toEqual([["1", "2"]]);
  });
});

describe("encodeCsv", () => {
  it("escapes commas and quotes", () => {
    const csv = encodeCsv([{ a: 'x"y', b: "1,2" }], ["a", "b"]);
    expect(csv).toContain('"x""y"');
    expect(csv).toContain('"1,2"');
  });
});

describe("detectDelimiter", () => {
  it("respects quoted delimiters", () => {
    // Comma inside quotes should not count
    expect(detectDelimiter('"a,b";c\n"1,2";3')).toBe(";");
  });
});
