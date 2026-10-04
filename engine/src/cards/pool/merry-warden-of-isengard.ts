import { defineCard } from "../define.js";
import { partnerWithTrigger } from "../helpers.js";

// EDHREC rank 5230.
//
// Rulings:
//   [2023-06-16] If your Commander deck has two commanders, you can only include cards whose own
//     color identities are also found in your commanders' combined color identities. If Frodo,
//     Adventurous Hobbit and Sam, Loyal Attendant are your commanders, your deck may contain cards
//     with white, black, and/or green in their color identity, but not blue or red.
//   [2023-06-16] The triggered ability of the "partner with" keyword still triggers in a Commander
//     game. If your other commander has somehow ended up in your library, you can find it. You can
//     also target another player, whether or not they have that card in their library.
//   [2023-06-16] "Partner with [name]" represents two abilities. The first is a triggered ability:
//     "When this permanent enters the battlefield, target player may search their library for a
//     card named [name], reveal it, put it into their hand, then shuffle their library."
//   [2023-06-16] An effect that checks whether you control your commander is satisfied if you
//     control one or both of your two commanders.
//   [2023-06-16] To have two commanders, both must have the partner ability or corresponding
//     "partner with" abilities as the game begins. A creature with a "partner with" ability can't
//     partner with any creature other than its designated partner. Losing a partner ability during
//     the game doesn't cause either to cease to be your commander.
//   [2023-06-16] Once the game begins, your two commanders are tracked separately. If you cast
//     one, you won't have to pay an additional {2} the first time you cast the other. A player
//     loses the game after having been dealt 21 damage from one of them, not from both of them
//     combined. Command Beacon's effect puts one into your hand from the command zone, not both.
//   [2023-06-16] Note that the target player searches their library (which may be affected by
//     effects such as that of Stranglehold) and that the card they find is revealed, even though
//     these words aren't included in the ability's reminder text.
//   [2023-06-16] The second ability represented by the "partner with [name]" keyword modifies the
//     rules for deck construction in the Commander variant and has no function outside of that
//     variant. If a legendary creature card with "partner with [name]" is designated as your
//     commander, the named legendary creature card can also be designated as your commander. For
//     more information on the Commander variant, please visit Wizards.com/Commander.
//   [2023-06-16] Both commanders start in the command zone, and the remaining 98 cards of your
//     deck are shuffled to become your library.

const SOLDIER_TEXT =
  "Whenever one or more artifacts you control enter, create a 1/1 white Soldier creature token with lifelink. This ability triggers only once each turn.";

export default defineCard({
  name: "Merry, Warden of Isengard",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Halfling", "Advisor"],
  power: 1,
  toughness: 4,
  pairing: { kind: "partner-with", name: "Pippin, Warden of Isengard" },
  text: `Partner with Pippin, Warden of Isengard (When this creature enters, target player may put Pippin into their hand from their library, then shuffle.)\n${SOLDIER_TEXT}`,
  triggered: [
    partnerWithTrigger("Pippin, Warden of Isengard"),
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" }, batched: true },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "create-token", token: "Lifelink Soldier Token", count: 1 },
      resolve: null,
      text: SOLDIER_TEXT,
    },
  ],
});
