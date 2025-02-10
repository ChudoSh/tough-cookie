"use strict";
const vows = require("vows");
const assert = require("assert");
const tough = require("../lib/cookie");

const MemoryCookieStore = tough.MemoryCookieStore;

vows
  .describe("pollution_prevention")
  .addBatch({
    "Verify MemoryCookieStore initialization and methods create null prototypes":
      {
        topic: function () {
          return new MemoryCookieStore();
        },
        "idx property with must be with null prototype": function (Store) {
          assert.strictEqual(
            Object.getPrototypeOf(Store.idx),
            null,
            "idx should be created with null prototype"
          );
        },
        "Nested fields must be with null prototypes": function (Store) {
          const cookie = {
            domain: "example.com",
            path: "/test",
            key: "testKey",
            value: "testValue",
          };
          Store.putCookie(cookie, () => {});
          assert.strictEqual(
            Object.getPrototypeOf(Store.idx[cookie.domain]),
            null,
            "Domain object should have null prototype"
          );
          assert.strictEqual(
            Object.getPrototypeOf(Store.idx[cookie.domain][cookie.path]),
            null,
            "Path object should have null prototype"
          );
        },
        "Verify RemoveAllCookies pollution prevention": function (Store) {
          Store.removeAllCookies(() => {});
          assert.strictEqual(
            Object.getPrototypeOf(Store.idx),
            null,
            "New idx should have null prototype after removal"
          );
        },
      },
  })
  .addBatch({
    "Verify when rejectPublicSuffixes is false then there is no pollution ": {
      topic: function () {
        return new tough.CookieJar(undefined, {
          rejectPublicSuffixes: false,
        });
      },
      "Prevent direct __proto__ assignment": function (CookieJar) {
        const evilCookie = new tough.Cookie({
          domain: "example.com",
          path: "/test",
          key: "testKey",
          value: "testValue",
          __proto__: { polluted: true },
        });
        CookieJar.setCookie(evilCookie, "http://example.com", () => {
          assert.strictEqual(Object.prototype.polluted, undefined);
        });
      },
      "Domain value as the pollution": function (CookieJar) {
        const evilCookie = new tough.Cookie({
          domain: "__proto__",
          path: "cookie",
          key: "monster",
          value: "true",
        });
        CookieJar.setCookie(evilCookie, "http://example.com", () => {
          assert.strictEqual(Object.prototype["cookie"], undefined);
        });
      },
      "Path value as the pollution": function (CookieJar) {
        const evilCookie = new tough.Cookie({
          domain: "test",
          path: "../__proto__/cookie",
          key: "monster",
          value: "true",
        });
        CookieJar.setCookie(evilCookie, "http://example.com", () => {
          assert.strictEqual(Object.prototype["cookie"], undefined);
        });
      },
    },
  })
  .export(module);
