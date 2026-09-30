import { defineCard } from "../define.js";

const TEXT =
  "Alliance — Whenever another creature you control enters, scry 1. If this is the second time this ability has resolved this turn, draw a card instead.";

// "Instead" replaces the scry on exactly the second resolution; the third
// and later scry again.
export default defineCard({
  name: "Rumor Gatherer",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elf", "Wizard"],
  power: 2,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "resolved-this-turn", n: 2 },
        then: { kind: "draw", amount: 1 },
        else: { kind: "scry", amount: 1 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
