import { defineCard } from "../define.js";

// Cavern of Souls's restricted half with a legendary filter in place of a
// chosen creature type. The "can't be countered" rides on the mana, so it
// protects only a spell this ability's mana actually paid for — the plain
// "{T}: Add {C}" is a separate ability and grants nothing.
const COLORLESS_TEXT = "{T}: Add {C}.";
const LEGENDARY_TEXT =
  "{T}: Add one mana of any color. Spend this mana only to cast a legendary spell, and that " +
  "spell can't be countered.";

export default defineCard({
  name: "Delighted Halfling",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Halfling", "Citizen"],
  power: 1,
  toughness: 2,
  text: COLORLESS_TEXT + "\n" + LEGENDARY_TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: COLORLESS_TEXT,
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: {
          spell: { supertype: "legendary" },
          uncounterable: true,
          text: "Spend this mana only to cast a legendary spell, and that spell can't be countered.",
        },
      },
      resolve: null,
      text: LEGENDARY_TEXT,
    },
  ],
});
