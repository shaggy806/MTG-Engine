import { defineCard } from "../define.js";

export default defineCard({
  name: "Aquus Steed",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 1,
  toughness: 3,
  text: "{2}{U}, {T}: Target creature gets -2/-0 until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{U}", tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{2}{U}, {T}: Target creature gets -2/-0 until end of turn.",
    },
  ],
});
