import { defineCard } from "../define.js";

export default defineCard({
  name: "Lady Caleria",
  manaCost: "{3}{G}{G}{W}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Archer"],
  power: 3,
  toughness: 6,
  text: "{T}: Lady Caleria deals 3 damage to target attacking or blocking creature.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["attacking-or-blocking-creature"],
      effect: { kind: "damage", amount: 3, target: 0 },
      resolve: null,
      text: "{T}: Lady Caleria deals 3 damage to target attacking or blocking creature.",
    },
  ],
});
