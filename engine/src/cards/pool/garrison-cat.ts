import { defineCard } from "../define.js";

export default defineCard({
  name: "Garrison Cat",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 1,
  toughness: 1,
  text: "When this creature dies, create a 1/1 white Human Soldier creature token.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Human Soldier Token", count: 1 },
      resolve: null,
      text: "When this creature dies, create a 1/1 white Human Soldier creature token.",
    },
  ],
});
