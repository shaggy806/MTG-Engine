import { defineCard } from "../define.js";

export default defineCard({
  name: "Stone-Seeder Hierophant",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 1,
  toughness: 1,
  text: "Landfall — Whenever a land you control enters, untap this creature.\n{T}: Untap target land.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["land"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{T}: Untap target land.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, untap this creature.",
    },
  ],
});
