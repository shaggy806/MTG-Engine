import { defineCard } from "../define.js";

export default defineCard({
  name: "Man-o'-War",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Jellyfish"],
  power: 2,
  toughness: 2,
  text: "When Man-o'-War enters the battlefield, return target creature to its owner's hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "When Man-o'-War enters the battlefield, return target creature to its owner's hand.",
    },
  ],
});
