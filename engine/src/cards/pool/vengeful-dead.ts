import { defineCard } from "../define.js";

export default defineCard({
  name: "Vengeful Dead",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 3,
  toughness: 2,
  text: "Whenever Vengeful Dead or another Zombie dies, each opponent loses 1 life.",
  triggered: [
    {
      // "**or another Zombie**" — anyone's, and itself included, so neither
      // `you-control` nor `otherOnly`.
      trigger: { on: "dies", who: "any", filter: { subtype: "Zombie" } },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever Vengeful Dead or another Zombie dies, each opponent loses 1 life.",
    },
  ],
});
