import { defineCard } from "../define.js";

export default defineCard({
  name: "Merfolk Skydiver",
  manaCost: "{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Merfolk", "Mutant"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, put a +1/+1 counter on target creature you control.\n{3}{G}{U}: Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  activated: [
    {
      cost: { mana: "{3}{G}{U}", tap: false },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "{3}{G}{U}: Proliferate.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "When this creature enters, put a +1/+1 counter on target creature you control.",
    },
  ],
});
