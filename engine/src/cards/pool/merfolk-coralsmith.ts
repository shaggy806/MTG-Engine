import { defineCard } from "../define.js";

export default defineCard({
  name: "Merfolk Coralsmith",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk"],
  power: 2,
  toughness: 3,
  text: "{1}: This creature gets +1/-1 until end of turn.\nWhen this creature dies, scry 2.",
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}: This creature gets +1/-1 until end of turn.",
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "When this creature dies, scry 2.",
    },
  ],
});
