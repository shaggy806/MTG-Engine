import { defineCard } from "../define.js";

export default defineCard({
  name: "Crucible of Worlds",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "You may play lands from your graveyard.",
  static: [
    {
      affects: { scope: "self" },
      playFromGraveyard: { type: "land" },
      text: "You may play lands from your graveyard.",
    },
  ],
});
