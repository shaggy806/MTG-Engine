import { defineCard } from "../define.js";
import { myriad } from "../helpers.js";

// EDHREC rank 5579.
//
// Rulings:
//   [2023-10-13] If the defending player is your only opponent, no tokens are put onto the
//     battlefield.
//   [2023-10-13] Although the tokens enter the battlefield attacking, they were never declared as
//     attackers. Abilities that trigger whenever a creature attacks won't trigger, including the
//     myriad ability of the tokens.
//   [2023-10-13] The token creatures all enter the battlefield at the same time.
// Goldlust Triad's myriad.
const MYRIAD_TEXT =
  "Myriad (Whenever this creature attacks, for each opponent other than defending player, you may create a token copy that's tapped and attacking that player or a planeswalker they control. Exile the tokens at end of combat.)";

export default defineCard({
  name: "Dalek Squadron",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Dalek"],
  power: 3,
  toughness: 3,
  keywords: ["menace"],
  text: `Menace\n${MYRIAD_TEXT}`,
  triggered: [myriad()],
});
