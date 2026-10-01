import { defineCard } from "../define.js";

const FACES = ["Expansion // Explosion", "Expansion", "Explosion"];
const EXPANSION_TEXT =
  "Copy target instant or sorcery spell with mana value 4 or less. You may choose new targets for the copy.";
const EXPLOSION_TEXT = "Explosion deals X damage to any target. Target player draws X cards.";

// The whole card: every zone but the stack (rule 709.4). Never cast itself —
// a spell is one half or the other (expansion.ts, explosion.ts).
export default defineCard({
  name: "Expansion // Explosion",
  manaCost: "{U/R}{U/R}{X}{U}{U}{R}{R}",
  colors: ["U", "R"],
  types: ["instant"],
  text: `${EXPANSION_TEXT}\n//\n${EXPLOSION_TEXT}`,
  faces: FACES,
  split: true,
});
