import { defineCard } from "../define.js";

export default defineCard({
  name: "Treetop Freedom Fighters",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Rebel", "Ally"],
  power: 2,
  toughness: 1,
  keywords: ["haste"],
  text: "Haste\nWhen this creature enters, create a 1/1 white Ally creature token.",
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
