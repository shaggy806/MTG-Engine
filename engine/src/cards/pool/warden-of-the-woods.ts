import { defineCard } from "../define.js";

export default defineCard({
  name: "Warden of the Woods",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 5,
  toughness: 7,
  keywords: ["vigilance"],
  text: "Vigilance (Attacking doesn't cause this creature to tap.)\nWhenever this creature becomes the target of a spell or ability an opponent controls, you may draw two cards.",
  triggered: [
    {
      trigger: { on: "becomes-target", who: "self", byOpponentOnly: true },
      targets: [],
      effect: { kind: "may", prompt: "Draw two cards?", effect: { kind: "draw", amount: 2 } },
      resolve: null,
      text: "Whenever this creature becomes the target of a spell or ability an opponent controls, you may draw two cards.",
    },
  ],
});
