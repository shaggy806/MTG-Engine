import { defineCard } from "../define.js";

export default defineCard({
  name: "Unwinding Clock",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "Untap all artifacts you control during each other player's untap step.",
  static: [
    {
      affects: { scope: "self" },
      untapsDuringOthersUntap: { type: "artifact" },
      text: "Untap all artifacts you control during each other player's untap step.",
    },
  ],
});
