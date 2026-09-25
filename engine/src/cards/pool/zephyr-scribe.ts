import { defineCard } from "../define.js";

export default defineCard({
  name: "Zephyr Scribe",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 2,
  toughness: 1,
  text: "{U}, {T}: Draw a card, then discard a card.\nWhenever you cast a noncreature spell, untap this creature.",
  activated: [
    {
      cost: { mana: "{U}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{U}, {T}: Draw a card, then discard a card.",
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "Whenever you cast a noncreature spell, untap this creature.",
    },
  ],
});
