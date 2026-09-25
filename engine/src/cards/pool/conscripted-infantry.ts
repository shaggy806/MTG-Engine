import { defineCard } from "../define.js";

export default defineCard({
  name: "Conscripted Infantry",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 1,
  text: "When this creature dies, create a 1/1 colorless Soldier artifact creature token.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Artifact Token", count: 1 },
      resolve: null,
      text: "When this creature dies, create a 1/1 colorless Soldier artifact creature token.",
    },
  ],
});
