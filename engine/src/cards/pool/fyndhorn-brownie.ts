import { defineCard } from "../define.js";

export default defineCard({
  name: "Fyndhorn Brownie",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Ouphe"],
  power: 1,
  toughness: 1,
  text: "{2}{G}, {T}: Untap target creature.",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: true },
      targets: ["creature"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{2}{G}, {T}: Untap target creature.",
    },
  ],
});
