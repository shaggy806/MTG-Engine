import { defineCard } from "../define.js";

export default defineCard({
  name: "Watchful Giant",
  manaCost: "{5}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Giant", "Soldier"],
  power: 3,
  toughness: 6,
  text: "When this creature enters, create a 1/1 white Human creature token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Human Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 white Human creature token.",
    },
  ],
});
