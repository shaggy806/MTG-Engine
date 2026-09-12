import { defineCard } from "../define.js";

// needed-cards P12. Real Oracle text (War of the Spark) has no static keyword
// grant at all — the planning note's guess was wrong, same as several P11
// cards. Both halves are already-shipped vocab: the draw is the same
// power>=4 filtered enters-battlefield trigger Garruk's Uprising uses, and
// -1 is an ordinary single-target loyalty ability.
export default defineCard({
  name: "Kiora, Behemoth Beckoner",
  manaCost: "{2}{G/U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Kiora"],
  loyalty: 7,
  text:
    "Whenever a creature you control with power 4 or greater enters, draw a card.\n" +
    "[-1]: Untap target permanent.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature", power: { op: "gte", n: 4 } },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever a creature you control with power 4 or greater enters, draw a card.",
    },
  ],
  activated: [
    {
      loyaltyCost: -1,
      cost: { mana: null, tap: false },
      targets: ["permanent"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "[-1]: Untap target permanent.",
    },
  ],
});
