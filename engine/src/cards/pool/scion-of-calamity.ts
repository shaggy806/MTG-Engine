import { defineCard } from "../define.js";
import { myriad } from "../helpers.js";

// EDHREC rank 3319.
//
// Rulings:
//   [2023-11-10] The tokens all enter the battlefield at the same time.
//   [2023-11-10] You choose whether each token is attacking the player or a planeswalker they
//     control as the token is created. If it's attacking a planeswalker, you choose which one. You
//     can't have any of the tokens attack a battle.
//   [2023-11-10] Any enters-the-battlefield abilities of the copied creature will trigger when the
//     tokens enter the battlefield. Any "as [this permanent] enters the battlefield" or "[this
//     permanent] enters the battlefield with" abilities of the copied creature will also work.
//   [2023-11-10] If myriad creates more than one token for any given player (due to an effect such
//     as the one Doubling Season creates), you may choose separately for each token whether it's
//     attacking the player or a planeswalker they control.
//   [2023-11-10] Each token copies exactly what was printed on the original creature and nothing
//     else. It doesn't copy whether that creature is tapped or untapped, whether it has any
//     counters on it or Auras and Equipment attached to it, or any non-copy effects that have
//     changed its power, toughness, types, color, and so on.
//   [2023-11-10] The term "defending player" in the myriad rules (or any other ability of an
//     attacking creature) refers to the player the creature with myriad was attacking, the
//     controller of the planeswalker it was attacking, or the protector of the battle it was
//     attacking at the time the ability resolves. If that creature is no longer attacking, it
//     refers to the appropriate player based on who or what the creature was last attacking.
//   [2023-11-10] Although the tokens enter the battlefield attacking, they were never declared as
//     attackers. Abilities that trigger whenever a creature attacks won't trigger, including the
//     myriad ability of the tokens. If there are any costs to have a creature attack, those costs
//     won't apply to the tokens.
//   [2023-11-10] If the defending player is your only opponent, no tokens are put onto the
//     battlefield.

const DESTROY_TEXT =
  "Whenever this creature deals combat damage to a player, destroy target artifact or enchantment that player controls.";

export default defineCard({
  name: "Scion of Calamity",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 5,
  toughness: 5,
  text: `Myriad (Whenever this creature attacks, for each opponent other than defending player, you may create a token copy that's tapped and attacking that player or a planeswalker they control. Exile the tokens at end of combat.)\n${DESTROY_TEXT}`,
  triggered: [
    myriad(),
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [
        { kind: "permanent", whose: "trigger-player", filter: { typesAnyOf: ["artifact", "enchantment"] } },
      ],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: DESTROY_TEXT,
    },
  ],
});
