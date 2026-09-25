import { defineCard } from "../define.js";

export default defineCard({
  name: "Seller of Songbirds",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 1,
  toughness: 2,
  text: "When this creature enters, create a 1/1 white Bird creature token with flying.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Bird Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 white Bird creature token with flying.",
    },
  ],
});
