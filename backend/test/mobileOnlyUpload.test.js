import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mobileOnlyUpload } from "../middleware/mobileOnly.js";

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("mobileOnlyUpload", () => {
  it("allows MOBILE_APP client", () => {
    let called = false;
    const req = { headers: { "x-client-type": "MOBILE_APP" } };
    const res = mockRes();
    mobileOnlyUpload(req, res, () => {
      called = true;
    });
    assert.equal(called, true);
  });

  it("blocks non-mobile clients with 403", () => {
    let called = false;
    const req = { headers: { "x-client-type": "WEB" } };
    const res = mockRes();
    mobileOnlyUpload(req, res, () => {
      called = true;
    });
    assert.equal(called, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, "Upload allowed only from BharatCloud Mobile App");
  });
});
