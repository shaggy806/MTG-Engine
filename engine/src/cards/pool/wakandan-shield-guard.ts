import { defineCard } from "../define.js";

export default defineCard({
  name: "Wakandan Shield Guard",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, create a 1/1 white Soldier creature token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 white Soldier creature token.",
    },
  ],
});
