import { defineCard } from "../define.js";
import { mobilize } from "../helpers.js";

const MOBILIZE_TEXT =
  "Mobilize 2 (Whenever this creature attacks, create two tapped and attacking 1/1 red Warrior creature tokens. Sacrifice them at the beginning of the next end step.)";
const STATIC_TEXT = "Your opponents can't cast spells during your turn.";

export default defineCard({
  name: "Voice of Victory",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Bard"],
  power: 1,
  toughness: 3,
  text: `${MOBILIZE_TEXT}\n${STATIC_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      prohibits: { who: "opponents", spells: true },
      text: STATIC_TEXT,
    },
  ],
  triggered: [mobilize(2)],
});
