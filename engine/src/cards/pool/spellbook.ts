import { defineCard } from "../define.js";

export default defineCard({
  name: "Spellbook",
  manaCost: "{0}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Book"],
  text: "You have no maximum hand size.",
  static: [{ affects: { scope: "self" }, noMaxHandSize: true, text: "You have no maximum hand size." }],
});
