import { defineCard } from "../define.js";

const TEXT = "Exile the top X cards of your library. You may play them until the end of your next turn.";
const HARMONIZE_TEXT =
  "Harmonize {X}{R}{R} (You may cast this card from your graveyard for its harmonize cost. You may tap a creature " +
  "you control to reduce that cost by an amount of generic mana equal to its power. Then exile this spell.)";

// Cards played this way follow their usual timing and costs (the ruling).
// Cast with harmonize, the tapped creature's power comes off the generic
// part of {X}{R}{R} — X included — never the {R}{R} (the rulings).
export default defineCard({
  name: "Zenith Festival",
  manaCost: "{X}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: `${TEXT}\n${HARMONIZE_TEXT}`,
  effect: { kind: "impulse-exile", amount: "x", duration: "your-next-turn" },
  harmonize: { cost: "{X}{R}{R}" },
});
