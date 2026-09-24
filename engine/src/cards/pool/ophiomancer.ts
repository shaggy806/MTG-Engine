import { defineCard } from "../define.js";

// "Each upkeep" — every player's. The Snake check is an intervening-if (rule
// 603.4): asked as the upkeep begins and again as the ability resolves.
export default defineCard({
  name: "Ophiomancer",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 2,
  text:
    "At the beginning of each upkeep, if you control no Snakes, create a 1/1 black Snake creature token with deathtouch.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "any" },
      condition: {
        kind: "not",
        of: { kind: "controls", filter: { subtype: "Snake" }, atLeast: 1 },
      },
      targets: [],
      effect: { kind: "create-token", token: "Black Deathtouch Snake Token", count: 1 },
      resolve: null,
      text:
        "At the beginning of each upkeep, if you control no Snakes, create a 1/1 black Snake creature token with deathtouch.",
    },
  ],
});
