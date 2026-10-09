import { describe, test, expect } from "@jest/globals";
import { estimateNeeds } from "../js/needEstimator_v1_1.js";

import testCases from "../data/test_diaries.json" with {
  type: "json"
};

describe("NeedEstimator v1.1 — T01〜T20", () => {

  for (const t of testCases) {

    test(`${t.id}: Expected Need`, () => {

      const result = estimateNeeds({
        diaryText: t.diary,
        emotions: t.emotions,
        auxiliary: {}
      });

      const expectedNeeds =
        t.needs.map(need => need.label);

      const actualNeeds =
        result.needs.map(need => need.label);

      for (const expected of expectedNeeds) {
        expect(actualNeeds).toContain(expected);
      }
    });

  }

});
