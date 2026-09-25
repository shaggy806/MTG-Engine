import { defineCard } from "../define.js";

export default defineCard({
  name: "Knotvine Mystic",
  manaCost: "{R}{G}{W}",
  colors: ["W", "R", "G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 2,
  toughness: 2,
  text: "{1}, {T}: Add {R}{G}{W}.",
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["R", "G", "W"] }, amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add {R}{G}{W}.",
    },
  ],
});
