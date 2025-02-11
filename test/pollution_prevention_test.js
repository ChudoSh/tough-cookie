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
        return new tough.CookieJar(undefined, { rejectPublicSuffixes: false });
      },
      "Positive test": function (CookieJar) {
        CookieJar.setCookieSync(
          "Normal=value; Domain=example.com",
          "http://example.com"  
        );
        const testObj = {};
        assert.strictEqual(testObj.polluted, undefined);
      },
      "Prevent domain __proto__ assignment": function (CookieJar) {
        CookieJar.setCookieSync(
          "Evil=polluted; Domain=__proto__",
          "http://__proto__"  
        );
        const testObj = {};
        assert.strictEqual(testObj.polluted, undefined);
      },
      "Path value as the pollution": function (CookieJar) {
        CookieJar.setCookieSync(
          "Evil=polluted; Domain=example.com; Path=/__proto__",
          "http://example.com"
        );
        const testObj = {};
        assert.strictEqual(testObj.polluted, undefined);
      },
    },
  })
  .export(module);
