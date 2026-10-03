import { defineCard } from "../define.js";

// Tapped only if it copies (rule 707.9e): declining, it enters untapped as
// itself, a land with no mana ability (its ruling). Played as a land or put
// onto the battlefield, it's asked either way.
export default defineCard({
  name: "Vesuva",
  colors: [],
  types: ["land"],
  text: "You may have this land enter tapped as a copy of any land on the battlefield.",
  copyOnEnter: { filter: { type: "land" }, tapped: true },
});
