import { defineCard } from "../define.js";

export default defineCard({
  name: "Fleeting Effigy",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: "Haste\nAt the beginning of your end step, return this creature to its owner's hand. (Return it only if it's on the battlefield.)\n{2}{R}: This creature gets +2/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{2}{R}: This creature gets +2/+0 until end of turn.",
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "At the beginning of your end step, return this creature to its owner's hand.",
    },
  ],
});
