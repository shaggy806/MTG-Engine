import { defineCard } from "../define.js";

export default defineCard({
  name: "Fledgling Griffin",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Griffin"],
  power: 2,
  toughness: 2,
  text: "Landfall — Whenever a land you control enters, this creature gains flying until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, this creature gains flying until end of turn.",
    },
  ],
});
