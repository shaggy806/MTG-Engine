import { defineCard } from "../define.js";

export default defineCard({
  name: "Shambling Strider",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Yeti"],
  power: 5,
  toughness: 5,
  text: "{R}{G}: This creature gets +1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}{G}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{R}{G}: This creature gets +1/-1 until end of turn.",
    },
  ],
});
