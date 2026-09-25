import { defineCard } from "../define.js";

export default defineCard({
  name: "City Pigeon",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhen this creature leaves the battlefield, create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")",
  triggered: [
    {
      trigger: { on: "leaves-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: "When this creature leaves the battlefield, create a Food token.",
    },
  ],
});
