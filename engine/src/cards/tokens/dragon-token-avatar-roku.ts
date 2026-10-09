import { defineCard } from "../define.js";
import { firebending } from "../helpers.js";

// Avatar Roku's Dragon token: 4/4 red, flying and firebending 4.

const FIREBENDING_TEXT =
  "Firebending 4 (Whenever this token attacks, add {R}{R}{R}{R}. This mana lasts until end of combat.)";

export default defineCard({
  name: "Dragon Token (Avatar Roku)",
  art: "cddc0746-6d3e-441f-866f-28587bf54801",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${FIREBENDING_TEXT}`,
  triggered: [firebending(4, FIREBENDING_TEXT)],
});
