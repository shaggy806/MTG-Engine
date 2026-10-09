import { defineCard } from "../define.js";
import { thisOrAnother } from "../helpers.js";

const TEXT =
  "Whenever this creature or another creature you control enters, you gain life equal to that creature's toughness.";

export default defineCard({
  name: "Verdant Sun's Avatar",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur", "Avatar"],
  power: 5,
  toughness: 5,
  text: TEXT,
  triggered: [
    ...thisOrAnother({
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "gain-life", amount: { toughnessOf: "trigger-object" } },
      resolve: null,
      text: TEXT,
    }),
  ],
});
