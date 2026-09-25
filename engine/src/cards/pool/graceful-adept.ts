import { defineCard } from "../define.js";

export default defineCard({
  name: "Graceful Adept",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 3,
  text: "You have no maximum hand size.",
  static: [{ affects: { scope: "self" }, noMaxHandSize: true, text: "You have no maximum hand size." }],
});
