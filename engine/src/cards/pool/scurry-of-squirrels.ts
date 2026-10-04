import { defineCard } from "../define.js";
import { myriad } from "../helpers.js";

// EDHREC rank 3294.
//
// Rulings:
//   [2024-07-26] You choose whether each token is attacking the player or a planeswalker they
//     control as the token is created. If it's attacking a planeswalker, you choose which one. You
//     can't have any of the tokens attack a battle.
//   [2024-07-26] The term "defending player" in the myriad rules (or any other ability of an
//     attacking creature) refers to the player the creature with myriad was attacking, the
//     controller of the planeswalker it was attacking, or the protector of the battle it was
//     attacking at the time the ability resolves. If that creature is no longer attacking, it
//     refers to the appropriate player based on who or what the creature was last attacking.
//   [2024-07-26] If an instance of myriad creates more than one token for any given player (due to
//     an effect such as the one Doubling Season creates), you may choose separately for each token
//     whether it's attacking the player or a planeswalker they control.
//   [2024-07-26] If the defending player is your only opponent, no tokens are put onto the
//     battlefield.
//   [2024-07-26] The tokens created by a single instance of myriad all enter at the same time.
//   [2024-07-26] Each token copies exactly what was printed on the original creature and nothing
//     else. It doesn't copy whether that creature is tapped or untapped, whether it has any
//     counters on it or Auras and Equipment attached to it, or any non-copy effects that have
//     changed its power, toughness, types, color, and so on.
//   [2024-07-26] Although the tokens enter attacking, they were never declared as attackers.
//     Abilities that trigger whenever a creature attacks won't trigger, including the myriad
//     ability of the tokens. If there are any costs to have a creature attack, those costs won't
//     apply to the tokens.
//   [2024-07-26] Any "enters" abilities of the copied creature will trigger when the tokens enter.
//     Any "as [this permanent] enters" or "[this permanent] enters with" abilities of the copied
//     creature will also work.

export default defineCard({
  name: "Scurry of Squirrels",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Squirrel", "Scout"],
  power: 2,
  toughness: 2,
  text: "Myriad, myriad (Whenever this creature attacks, for each opponent other than defending player, you may create a token that's a copy of this creature that's tapped and attacking that player or a planeswalker they control. Then do it again. Exile the tokens at end of combat.)\nWhenever this creature deals combat damage to a player, put a +1/+1 counter on target creature you control.",
  // Two instances of myriad, each triggering on its own (rule 702.116b) —
  // the reminder's "Then do it again".
  triggered: [
    myriad(),
    myriad(),
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, put a +1/+1 counter on target creature you control.",
    },
  ],
});
