import { defineCard } from "../define.js";

export default defineCard({
  name: "Soulsworn Jury",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 4,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)\n{1}{U}, Sacrifice this creature: Counter target creature spell.",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false, sacrifice: "self" },
      targets: ["creature-spell"],
      effect: { kind: "counter", target: 0 },
      resolve: null,
      text: "{1}{U}, Sacrifice this creature: Counter target creature spell.",
    },
  ],
});
