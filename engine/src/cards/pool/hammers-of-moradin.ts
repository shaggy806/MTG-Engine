import type { TargetSpec } from "../../target.js";
import { defineCard } from "../define.js";
import { myriad } from "../helpers.js";

// EDHREC rank 5006.
//
// Rulings:
//   [2022-06-10] Any enters-the-battlefield abilities of the copied creature will trigger when the
//     tokens enter the battlefield. Any “as [this permanent] enters the battlefield” or “[this
//     permanent] enters the battlefield with” abilities of the copied creature will also work.
//   [2022-06-10] Each token copies exactly what was printed on the original creature and nothing
//     else. It doesn’t copy whether that creature is tapped or untapped, whether it has any
//     counters on it or Auras and Equipment attached to it, or any non-copy effects that have
//     changed its power, toughness, types, color, and so on.
//   [2022-06-10] If myriad creates more than one token for any given player (due to an effect such
//     as the one Doubling Season creates), you may choose separately for each token whether it’s
//     attacking the player or a planeswalker they control.
//   [2022-06-10] If the defending player is your only opponent, no tokens are put onto the
//     battlefield.
//   [2022-06-10] You choose whether each token is attacking the player or a planeswalker they
//     control as the token is created. If it’s attacking a planeswalker, you choose which one.
//   [2022-06-10] Although the tokens enter the battlefield attacking, they were never declared as
//     attackers. Abilities that trigger whenever a creature attacks won’t trigger, including the
//     myriad ability of the tokens. If there are any costs to have a creature attack, those costs
//     won’t apply to the tokens.
//   [2022-06-10] The term “defending player” in the myriad rules (or any other ability of an
//     attacking creature) refers to the player the creature with myriad was attacking or the
//     controller of the planeswalker it was attacking at the time the ability resolves. If that
//     creature is no longer attacking, it refers to the player it was last attacking or the
//     controller of the planeswalker it was last attacking.
//   [2022-06-10] The tokens all enter the battlefield at the same time.

// "For each opponent, … up to one target creature that player controls": one
// optional slot per opponent seat (Hideous Taskmaster's shape); a seat with
// no target chosen is a hole the tap for it skips.
const MYRIAD_TEXT =
  "Myriad (Whenever this creature attacks, for each opponent other than defending player, you may create a token copy that's tapped and attacking that player or a planeswalker they control. Exile the tokens at end of combat.)";
const TAP_TEXT =
  "Whenever this creature attacks, for each opponent, tap up to one target creature that player controls.";

const perOpponent = (seat: number): TargetSpec => ({
  kind: "optional",
  of: { kind: "permanent", whose: { seat }, filter: { type: "creature" } },
});

export default defineCard({
  name: "Hammers of Moradin",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dwarf", "Cleric"],
  power: 3,
  toughness: 3,
  text: `${MYRIAD_TEXT}\n${TAP_TEXT}`,
  triggered: [
    myriad(),
    {
      trigger: { on: "attacks", who: "self" },
      targets: [perOpponent(1), perOpponent(2), perOpponent(3)],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "tap", target: 0 },
          { kind: "tap", target: 1 },
          { kind: "tap", target: 2 },
        ],
      },
      resolve: null,
      text: TAP_TEXT,
    },
  ],
});
