import { defineCard } from "../define.js";
import { myriad } from "../helpers.js";

// EDHREC rank 6602.
//
// Rulings:
//   [2025-11-17] If the defending player is your only opponent, no tokens are put onto the
//     battlefield.
//   [2025-11-17] Although the tokens enter attacking, they were never declared as attackers.
//     Abilities that trigger whenever a creature attacks won't trigger, including the myriad
//     ability of the tokens.
//   [2025-11-17] Each token copies exactly what was printed on the original creature and nothing
//     else.
//
// The myriad granted is the `myriad` helper's trigger (Blade of Selves), on the target until end
// of turn: its copies are of that Elemental, and a granted ability isn't copied (rule 707.2).
const COMBAT_TEXT =
  "At the beginning of combat on your turn, another target Elemental you control gains myriad until end of turn. (Whenever it attacks, for each opponent other than defending player, you may create a token copy that's tapped and attacking that player or a planeswalker they control. Exile the tokens at end of combat.)";

export default defineCard({
  name: "Mass of Mysteries",
  manaCost: "{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 5,
  keywords: ["first-strike", "vigilance", "trample"],
  text: `First strike, vigilance, trample\n${COMBAT_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [{ kind: "other", of: { kind: "permanent", whose: "you", filter: { subtype: "Elemental" } } }],
      effect: { kind: "grant-triggered", target: 0, ability: myriad(), duration: "end-of-turn" },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
