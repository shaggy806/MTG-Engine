import { defineCard } from "../define.js";

export default defineCard({
  name: "Poison-Tip Archer",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Elf", "Archer"],
  power: 2,
  toughness: 3,
  keywords: ["reach", "deathtouch"],
  text: "Reach (This creature can block creatures with flying.)\nDeathtouch (Any amount of damage this deals to a creature is enough to destroy it.)\nWhenever another creature dies, each opponent loses 1 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever another creature dies, each opponent loses 1 life.",
    },
  ],
});
