import { defineCard } from "../define.js";

export default defineCard({
  name: "Goldmaw Champion",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dwarf", "Warrior"],
  power: 2,
  toughness: 3,
  text: "Boast — {1}{W}: Tap target creature. (Activate only if this creature attacked this turn and only once each turn.)",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "Boast — {1}{W}: Tap target creature.",
      boast: true,
    },
  ],
});
