/**
 * Thin shim mapping Vitest-style API onto Node's built-in node:test.
 * Keeps tests portable: run with `node --test` (no rollup/rolldown needed).
 */
import { test as nodeTest, describe as nodeDescribe, before, beforeEach as nodeBeforeEach } from "node:test";
import assert from "node:assert/strict";

export const describe = nodeDescribe;
export const it = nodeTest;
export const test = nodeTest;
export const beforeAll = before;
export const beforeEach = nodeBeforeEach;

class ExpectMatcher {
  constructor(
    private actual: unknown,
    private negated = false,
  ) {}

  private check(pass: boolean, msg: string) {
    if (this.negated ? pass : !pass) {
      assert.fail(msg);
    }
  }

  get not(): ExpectMatcher {
    return new ExpectMatcher(this.actual, !this.negated);
  }

  get resolves() {
    const actual = this.actual;
    return {
      toBe: async (v: unknown) => {
        const got = await (actual as Promise<unknown>);
        if (!Object.is(got, v)) assert.fail(`expected resolved ${JSON.stringify(v)}, got ${JSON.stringify(got)}`);
      },
      toBeUndefined: async () => {
        const got = await (actual as Promise<unknown>);
        if (got !== undefined) assert.fail(`expected resolved undefined, got ${JSON.stringify(got)}`);
      },
    };
  }

  get rejects() {
    const actual = this.actual;
    return {
      toThrow: async () => {
        try {
          await (actual as Promise<unknown>);
          assert.fail("expected promise to reject");
        } catch {
          /* ok */
        }
      },
    };
  }

  toBe(expected: unknown) {
    this.check(
      Object.is(this.actual, expected),
      `expected ${JSON.stringify(this.actual)} ${this.negated ? "NOT to be" : "to be"} ${JSON.stringify(expected)}`,
    );
  }
  toEqual(expected: unknown) {
    let pass = true;
    try {
      assert.deepStrictEqual(this.actual, expected);
    } catch {
      pass = false;
    }
    this.check(pass, `expected ${JSON.stringify(this.actual)} ${this.negated ? "NOT to equal" : "to equal"} ${JSON.stringify(expected)}`);
  }
  toContain(substr: unknown) {
    let pass = false;
    if (typeof this.actual === "string") pass = this.actual.includes(String(substr));
    else if (Array.isArray(this.actual)) pass = this.actual.includes(substr);
    this.check(pass, `expected ${JSON.stringify(this.actual)} ${this.negated ? "NOT to contain" : "to contain"} ${JSON.stringify(substr)}`);
  }
  toMatch(re: RegExp | string) {
    const pattern = typeof re === "string" ? new RegExp(re) : re;
    this.check(
      typeof this.actual === "string" && pattern.test(this.actual),
      `expected ${JSON.stringify(this.actual)} ${this.negated ? "NOT to match" : "to match"} ${pattern}`,
    );
  }
  toHaveLength(n: number) {
    const got = (this.actual as { length?: number })?.length;
    this.check(got === n, `expected length ${n}, got ${got}`);
  }
  toBeDefined() {
    this.check(this.actual !== undefined, `expected defined, got undefined`);
  }
  toBeNull() {
    this.check(this.actual === null, `expected null, got ${JSON.stringify(this.actual)}`);
  }
  toBeUndefined() {
    this.check(this.actual === undefined, `expected undefined, got ${JSON.stringify(this.actual)}`);
  }
  toBeGreaterThan(n: number) {
    this.check(typeof this.actual === "number" && this.actual > n, `expected > ${n}, got ${this.actual}`);
  }
  toBeLessThan(n: number) {
    this.check(typeof this.actual === "number" && this.actual < n, `expected < ${n}, got ${this.actual}`);
  }
  toBeTruthy() {
    this.check(Boolean(this.actual), `expected truthy, got ${JSON.stringify(this.actual)}`);
  }
  toBeFalsy() {
    this.check(!this.actual, `expected falsy, got ${JSON.stringify(this.actual)}`);
  }
}

export function expect(actual: unknown): ExpectMatcher {
  return new ExpectMatcher(actual, false);
}
