import { defineCard } from "../define.js";

export default defineCard({
  name: "Auratog",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Atog"],
  power: 1,
  toughness: 2,
  text: "Sacrifice an enchantment: This creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "enchantment" } } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice an enchantment: This creature gets +2/+2 until end of turn.",
    },
  ],
});
