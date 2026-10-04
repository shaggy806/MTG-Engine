import { defineCard } from "../define.js";
import { mobilize } from "../helpers.js";

// EDHREC rank 6004.
// Makes Warrior → "Red Warrior Token" (via the mobilize helper).

export default defineCard({
  name: "Dalkovan Packbeasts",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Ox"],
  power: 0,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance\nMobilize 3 (Whenever this creature attacks, create three tapped and attacking 1/1 red Warrior creature tokens. Sacrifice them at the beginning of the next end step.)",
  triggered: [mobilize(3)],
});
