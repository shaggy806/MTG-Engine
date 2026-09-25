import { defineCard } from "../define.js";

export default defineCard({
  name: "Thaumatog",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Atog"],
  power: 1,
  toughness: 2,
  text: "Sacrifice a land: This creature gets +1/+1 until end of turn.\nSacrifice an enchantment: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice a land: This creature gets +1/+1 until end of turn.",
    },
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "enchantment" } } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice an enchantment: This creature gets +1/+1 until end of turn.",
    },
  ],
});
