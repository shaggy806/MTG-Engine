import { defineCard } from "../define.js";

export default defineCard({
  name: "Triton Waverider",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 3,
  toughness: 3,
  text: "Constellation — Whenever an enchantment you control enters, this creature gains flying until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Constellation — Whenever an enchantment you control enters, this creature gains flying until end of turn.",
    },
  ],
});
