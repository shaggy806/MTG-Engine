import { defineCard } from "../define.js";
import { myriad } from "../helpers.js";

// EDHREC rank 5766.
//
// Rulings:
//   [2022-06-10] Firbolg Flutist's triggered ability can target any creature you don't control,
//     even one that is untapped.
//   [2022-06-10] Gaining control of a creature doesn't cause you to gain control of any Auras or
//     Equipment attached to it.
//   [2022-06-10] Each token copies exactly what was printed on the original creature and nothing
//     else. It doesn’t copy whether that creature is tapped or untapped, whether it has any
//     counters on it or Auras and Equipment attached to it, or any non-copy effects that have
//     changed its power, toughness, types, color, and so on.
//   [2022-06-10] If myriad creates more than one token for any given player (due to an effect such
//     as the one Doubling Season creates), you may choose separately for each token whether it’s
//     attacking the player or a planeswalker they control.
//   [2022-06-10] Any enters-the-battlefield abilities of the copied creature will trigger when the
//     tokens enter the battlefield. Any “as [this permanent] enters the battlefield” or “[this
//     permanent] enters the battlefield with” abilities of the copied creature will also work.
//   [2022-06-10] The term “defending player” in the myriad rules (or any other ability of an
//     attacking creature) refers to the player the creature with myriad was attacking or the
//     controller of the planeswalker it was attacking at the time the ability resolves. If that
//     creature is no longer attacking, it refers to the player it was last attacking or the
//     controller of the planeswalker it was last attacking.
//   [2022-06-10] Although the tokens enter the battlefield attacking, they were never declared as
//     attackers. Abilities that trigger whenever a creature attacks won’t trigger, including the
//     myriad ability of the tokens. If there are any costs to have a creature attack, those costs
//     won’t apply to the tokens.
//   [2022-06-10] The tokens all enter the battlefield at the same time.
//   [2022-06-10] If the defending player is your only opponent, no tokens are put onto the
//     battlefield.
//   [2022-06-10] You choose whether each token is attacking the player or a planeswalker they
//     control as the token is created. If it’s attacking a planeswalker, you choose which one.

export default defineCard({
  name: "Firbolg Flutist",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Giant", "Bard"],
  power: 4,
  toughness: 4,
  text: "Enthralling Performance — When this creature enters, gain control of target creature you don't control until end of turn. Untap it. It gains haste and myriad until end of turn. (Whenever it attacks, for each opponent other than defending player, you may create a token copy that's tapped and attacking that player or a planeswalker they control. Exile the tokens at end of combat.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-control", target: 0, untilEndOfTurn: true },
          { kind: "untap", target: 0 },
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
          { kind: "grant-triggered", target: 0, ability: myriad(), duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: "Enthralling Performance — When this creature enters, gain control of target creature you don't control until end of turn. Untap it. It gains haste and myriad until end of turn.",
    },
  ],
});
