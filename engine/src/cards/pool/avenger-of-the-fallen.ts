import { defineCard } from "../define.js";
import { mobilize } from "../helpers.js";

// X is counted as the mobilize trigger resolves.
const MOBILIZE_TEXT =
  "Mobilize X, where X is the number of creature cards in your graveyard. (Whenever this creature attacks, create X tapped and attacking 1/1 red Warrior creature tokens. Sacrifice them at the beginning of the next end step.)";

export default defineCard({
  name: "Avenger of the Fallen",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 4,
  keywords: ["deathtouch"],
  text: `Deathtouch\n${MOBILIZE_TEXT}`,
  triggered: [mobilize({ countInGraveyard: { type: "creature", ownedBy: "you" } })],
});
