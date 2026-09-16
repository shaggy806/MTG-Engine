import { defineCard } from "../define.js";

export default defineCard({
  name: "Drumhunter",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid", "Warrior"],
  power: 2,
  toughness: 2,
  text:
    "At the beginning of your end step, if you control a creature with power 5 " +
    "or greater, you may draw a card.\n" +
    "{T}: Add {C}.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: {
        kind: "controls",
        filter: { type: "creature", power: { op: "gte", n: 5 } },
        atLeast: 1,
      },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text:
        "At the beginning of your end step, if you control a creature with power 5 " +
        "or greater, you may draw a card.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
  ],
});
