import { defineCard } from "../define.js";

// EDHREC rank 6214.

export default defineCard({
  name: "Transcendent Message",
  manaCost: "{X}{U}{U}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Convoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)\nDraw X cards.",
  convoke: true,
  effect: { kind: "draw", amount: "x" },
});
