import { defineCard } from "../define.js";

export default defineCard({
  name: "Jhessian Infiltrator",
  manaCost: "{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 2,
  text: "This creature can't be blocked.",
  static: [
    {
      affects: { scope: "self" },
      grantKeywords: ["unblockable"],
      text: "This creature can't be blocked.",
    },
  ],
});
