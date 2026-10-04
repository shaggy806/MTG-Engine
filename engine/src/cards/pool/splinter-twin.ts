import { defineCard } from "../define.js";

// EDHREC rank 5463.
//
// Rulings:
//   [2010-06-15] Splinter Twin grants an activated ability to the enchanted creature. That
//     creature's controller (who is not necessarily the Aura's controller) can activate it. The
//     creature's controller is the player who gets the token.
//   [2010-06-15] The token will not be kicked, even if the creature it's copying was.
//   [2010-06-15] If the enchanted creature is copying something else when the ability resolves
//     (for example, if it's a Renegade Doppelganger), then the token enters as a copy of whatever
//     the enchanted creature is copying, plus it has haste.
//   [2010-06-15] If the token isn't exiled when the delayed triggered ability resolves (due to
//     Stifle, perhaps), it remains on the battlefield indefinitely. It continues to have haste.
//   [2010-06-15] If the enchanted creature has {X} in its mana cost (such as Protean Hydra), X is
//     considered to be zero.
//   [2010-06-15] The token is exiled at the beginning of the next end step regardless of who
//     controls it at that time, or whether Splinter Twin or the enchanted creature is still on the
//     battlefield at that time.
//   [2010-06-15] If the enchanted creature is a token, the new token copies the characteristics of
//     the original token as stated by the effect that put it onto the battlefield, plus it has
//     haste.
//   [2010-06-15] Any "enters" abilities of the enchanted creature will trigger when the token is
//     put onto the battlefield. Any "as [this creature] enters" or "[this creature] enters with"
//     abilities of the enchanted creature will also work.
//   [2010-06-15] If you activate the ability and the enchanted creature leaves the battlefield
//     before the ability resolves, you still get a token. The enchanted creature's last existence
//     on the battlefield is checked to see what it was (specifically, if it was itself or if it
//     was copying something else).
//   [2010-06-15] If the ability is activated during a turn's end step, the token will be exiled at
//     the beginning of the following turn's end step.
//   [2010-06-15] The token that's put onto the battlefield copies exactly what's printed on the
//     enchanted creature (unless that creature is copying something else or it's a token; see
//     below), plus it has haste. It doesn't copy whether the enchanted creature is tapped or
//     untapped, whether it has any counters on it or Auras attached to it, or whether it's been
//     affected by any noncopy effects that changed its power, toughness, types, color, or so on.
//     In particular, it doesn't copy the ability granted to the enchanted creature by Splinter
//     Twin.
//   [2013-07-01] If the enchanted creature is legendary, you will have to put either the original
//     creature or the token into the graveyard as a state-based action.

const GRANT_TEXT =
  "{T}: Create a token that's a copy of this creature, except it has haste. Exile that token at the beginning of the next end step.";

export default defineCard({
  name: "Splinter Twin",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\nEnchanted creature has "${GRANT_TEXT}"`,
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantsActivated: [
        {
          cost: { mana: null, tap: true },
          targets: [],
          // "This creature" is the granted ability's own permanent — its
          // source; one that has left is copied as it last existed (the
          // ruling), and the token enters under its controller.
          effect: { kind: "create-token-copy", of: "source", count: 1, gainsHaste: true, exileAtEndStep: true },
          resolve: null,
          text: GRANT_TEXT,
        },
      ],
      text: `Enchanted creature has "${GRANT_TEXT}"`,
    },
  ],
});
