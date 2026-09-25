import { defineCard } from "../define.js";

export default defineCard({
  name: "Elfsworn Giant",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 5,
  toughness: 3,
  keywords: ["reach"],
  text: "Reach (This creature can block creatures with flying.)\nLandfall — Whenever a land you control enters, create a 1/1 green Elf Warrior creature token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "create-token", token: "Elf Warrior Token", count: 1 },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, create a 1/1 green Elf Warrior creature token.",
    },
  ],
});
