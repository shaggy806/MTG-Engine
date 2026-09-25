import { defineCard } from "../define.js";

export default defineCard({
  name: "Attended Knight",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["first-strike"],
  text: "First strike\nWhen this creature enters, create a 1/1 white Soldier creature token.",
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
