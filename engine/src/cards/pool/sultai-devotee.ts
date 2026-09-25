import { defineCard } from "../define.js";

export default defineCard({
  name: "Sultai Devotee",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Zombie", "Snake", "Druid"],
  power: 2,
  toughness: 1,
  keywords: ["deathtouch"],
  text: "Deathtouch\n{1}: Add {B}, {G}, or {U}. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "G", "U"] }, amount: 1 },
      resolve: null,
      text: "{1}: Add {B}, {G}, or {U}. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
