import { defineCard } from "../define.js";

const STRIKE_TEXT = "During your turn, other historic creatures you control have double strike.";

// Historic: artifact, legendary or Saga (rule 700.6). Disguise {1}{R}{W}
// (rule 702.168): cast face down for {3} as a 2/2 with ward {2}.
export default defineCard({
  name: "Bayek of Siwa",
  manaCost: "{3}{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 3,
  toughness: 4,
  keywords: ["double-strike"],
  text: `Double strike\n${STRIKE_TEXT}\nDisguise {1}{R}{W}`,
  morph: { keyword: "disguise", cost: "{1}{R}{W}" },
  static: [
    {
      affects: {
        scope: "filter",
        filter: {
          type: "creature",
          controlledBy: "you",
          anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }],
        },
        excludeSelf: true,
      },
      condition: { kind: "your-turn" },
      grantKeywords: ["double-strike"],
      text: STRIKE_TEXT,
    },
  ],
});
