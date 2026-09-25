import { defineCard } from "../define.js";

export default defineCard({
  name: "Kyoshi Warriors",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Ally"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, create a 1/1 white Ally creature token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Ally Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 white Ally creature token.",
    },
  ],
});
