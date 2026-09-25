import { defineCard } from "../define.js";

export default defineCard({
  name: "Daysquad Marshal",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, create a 1/1 white Human Soldier creature token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Human Soldier Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 white Human Soldier creature token.",
    },
  ],
});
