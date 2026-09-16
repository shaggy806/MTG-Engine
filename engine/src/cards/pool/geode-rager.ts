import { defineCard } from "../define.js";

export default defineCard({
  name: "Geode Rager",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 4,
  toughness: 3,
  keywords: ["first-strike"],
  text:
    "First strike\n" +
    "Landfall — Whenever a land you control enters, goad each creature target player controls.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: ["opponent"],
      effect: { kind: "goad", target: 0 },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, goad each creature target player controls.",
    },
  ],
});
