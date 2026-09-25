import { defineCard } from "../define.js";

export default defineCard({
  name: "Harrier Strix",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, tap target permanent.\n{2}{U}: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: "{2}{U}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{2}{U}: Draw a card, then discard a card.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["permanent"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "When this creature enters, tap target permanent.",
    },
  ],
});
