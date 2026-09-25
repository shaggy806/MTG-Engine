import { defineCard } from "../define.js";

export default defineCard({
  name: "Lore Weaver",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  pairing: { kind: "partner-with", name: "Ley Weaver" },
  text: "Partner with Ley Weaver (When this creature enters, target player may put Ley Weaver into their hand from their library, then shuffle.)\n{5}{U}{U}: Target player draws two cards.",
  activated: [
    {
      cost: { mana: "{5}{U}{U}", tap: false },
      targets: ["player"],
      effect: { kind: "draw", amount: 2, target: 0 },
      resolve: null,
      text: "{5}{U}{U}: Target player draws two cards.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: {
        kind: "search-library",
        filter: { name: "Ley Weaver" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
        who: { controllerOfTarget: 0 },
      },
      resolve: null,
      text: "When this creature enters, target player may search their library for a card named Ley Weaver, reveal it, put it into their hand, then shuffle.",
    },
  ],
});
