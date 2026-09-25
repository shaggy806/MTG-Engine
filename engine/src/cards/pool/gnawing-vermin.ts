import { defineCard } from "../define.js";

export default defineCard({
  name: "Gnawing Vermin",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Rat"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, target player mills two cards.\nWhen this creature dies, target creature you don't control gets -1/-1 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 2 },
      resolve: null,
      text: "When this creature enters, target player mills two cards.",
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature dies, target creature you don't control gets -1/-1 until end of turn.",
    },
  ],
});
