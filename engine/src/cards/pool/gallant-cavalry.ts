import { defineCard } from "../define.js";

export default defineCard({
  name: "Gallant Cavalry",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance"],
  text: "Vigilance (Attacking doesn't cause this creature to tap.)\nWhen this creature enters, create a 2/2 white Knight creature token with vigilance.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Knight Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 2/2 white Knight creature token with vigilance.",
    },
  ],
});
