import { defineCard } from "../define.js";

// #390 in top-commanders.txt.
//
// "Any number of creature cards" has no upper bound but the library itself.
const LIFE_TEXT = "If you would gain life, you gain that much life plus 1 instead.";
const PARTY_TEXT =
  "{2}{W}{B}{G}, {T}, Exile Bilbo: Search your library for any number of creature cards, put them onto " +
  "the battlefield, then shuffle. Activate only if you have 111 or more life.";

export default defineCard({
  name: "Bilbo, Birthday Celebrant",
  manaCost: "{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Halfling", "Rogue"],
  power: 2,
  toughness: 3,
  text: `${LIFE_TEXT}\n${PARTY_TEXT}`,
  static: [
    { affects: { scope: "self" }, replacement: { event: "would-gain-life", who: "you", plus: 1 }, text: LIFE_TEXT },
  ],
  activated: [
    {
      cost: { mana: "{2}{W}{B}{G}", tap: true, exileSelf: true },
      condition: { kind: "life-total", atLeast: 111 },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "creature" },
        destination: "battlefield",
        min: 0,
        max: 1000,
      },
      resolve: null,
      text: PARTY_TEXT,
    },
  ],
});
