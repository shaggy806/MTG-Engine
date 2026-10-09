import { defineCard } from "../define.js";
import { thisOrAnother } from "../helpers.js";

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
    ...thisOrAnother({
      // "**or another Zombie**" — anyone's, so not `you-control`; and
      // Vengeful Dead itself whatever it is by then.
      trigger: { on: "dies", who: "any", filter: { subtype: "Zombie" } },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever Vengeful Dead or another Zombie dies, each opponent loses 1 life.",
    }),
  ],
});
