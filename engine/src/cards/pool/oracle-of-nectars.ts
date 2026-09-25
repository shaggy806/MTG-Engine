import { defineCard } from "../define.js";

export default defineCard({
  name: "Oracle of Nectars",
  manaCost: "{2}{G/W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Elf", "Cleric"],
  power: 2,
  toughness: 2,
  text: "{X}, {T}: You gain X life.",
  activated: [
    {
      cost: { mana: "{X}", tap: true },
      targets: [],
      effect: { kind: "gain-life", amount: "x" },
      resolve: null,
      text: "{X}, {T}: You gain X life.",
    },
  ],
});
