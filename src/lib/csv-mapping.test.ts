import { describe, expect, it } from "@/lib/test-shim";
import { autoMap, detectProvider, parseTagsCell } from "@/lib/csv-mapping";

describe("autoMap", () => {
  it("maps Bit.ly headers", () => {
    const m = autoMap(["id", "title", "long_url", "created_at", "link", "archived", "tags"]);
    expect(m.destination_url).toBe(2);
    expect(m.title).toBe(1);
    expect(m.tags).toBe(6);
  });

  it("maps Rebrandly headers", () => {
    const m = autoMap(["title", "destination", "short_url", "slashtag", "domain", "created", "tags"]);
    expect(m.destination_url).toBe(1);
    expect(m.slug).toBe(3);
    expect(m.title).toBe(0);
  });

  it("maps Short.io headers (camelCase)", () => {
    const m = autoMap(["OriginalURL", "ShortURL", "Path", "Title", "CreatedAt"]);
    expect(m.destination_url).toBe(0);
    expect(m.slug).toBe(2);
    expect(m.title).toBe(3);
  });

  it("maps Dub.co headers", () => {
    const m = autoMap(["Link ID", "Domain", "Key", "URL", "Title", "Expires At", "Password"]);
    expect(m.destination_url).toBe(3);
    expect(m.slug).toBe(2);
    expect(m.title).toBe(4);
    expect(m.expires_at).toBe(5);
    expect(m.password).toBe(6);
  });

  it("returns null for unmapped fields", () => {
    const m = autoMap(["destination_url"]);
    expect(m.tags).toBe(null);
    expect(m.password).toBe(null);
  });

  it("ignores case and whitespace in headers", () => {
    const m = autoMap(["  Long URL  ", "Original_URL"]);
    expect(m.destination_url).toBe(0);
  });
});

describe("detectProvider", () => {
  it("detects bitly", () => {
    expect(detectProvider(["id", "long_url", "link", "title"])).toBe("bitly");
  });
  it("detects rebrandly via slashtag", () => {
    expect(detectProvider(["title", "destination", "slashtag"])).toBe("rebrandly");
  });
  it("detects shortio", () => {
    expect(detectProvider(["OriginalURL", "Path", "Title"])).toBe("shortio");
  });
  it("falls back to linky template", () => {
    expect(detectProvider(["destination_url", "slug"])).toBe("linky");
  });
  it("returns unknown for foreign schema", () => {
    expect(detectProvider(["foo", "bar", "baz"])).toBe("unknown");
  });
});

describe("parseTagsCell", () => {
  it("splits by comma", () => {
    expect(parseTagsCell("a,b,c")).toEqual(["a", "b", "c"]);
  });
  it("splits by pipe (Bit.ly style)", () => {
    expect(parseTagsCell("marketing|launch|2026")).toEqual(["marketing", "launch", "2026"]);
  });
  it("trims whitespace", () => {
    expect(parseTagsCell(" a , b ,  c")).toEqual(["a", "b", "c"]);
  });
  it("filters empty", () => {
    expect(parseTagsCell(",,a,,")).toEqual(["a"]);
  });
  it("handles null/empty", () => {
    expect(parseTagsCell(null)).toEqual([]);
    expect(parseTagsCell("")).toEqual([]);
  });
});
