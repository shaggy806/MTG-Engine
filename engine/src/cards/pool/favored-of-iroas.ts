import { defineCard } from "../define.js";

export default defineCard({
  name: "Favored of Iroas",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  text: "Constellation — Whenever an enchantment you control enters, this creature gains double strike until end of turn. (It deals both first-strike and regular combat damage.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "double-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Constellation — Whenever an enchantment you control enters, this creature gains double strike until end of turn.",
    },
  ],
});
