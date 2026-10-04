import { defineCard } from "../define.js";

// EDHREC rank 4165.
//
// Rulings:
//   [2025-06-06] If your Commander deck has two commanders, you can only include cards whose own
//     color identities are also found in your commanders' combined color identities. If Alisaie
//     Leveilleur and Alphinaud Leveilleur are your commanders, your deck may contain cards with
//     white and/or blue in their color identity, but not black, red, or green.
//   [2025-06-06] Once the game begins, your two commanders are tracked separately. If you cast
//     one, you won't have to pay an additional {2} the first time you cast the other. A player
//     loses the game after having been dealt 21 damage from one of them, not from both of them
//     combined. Command Beacon's effect puts one into your hand from the command zone, not both.
//   [2025-06-06] An effect that checks whether you control your commander is satisfied if you
//     control one or both of your two commanders.
//   [2025-06-06] Both commanders start in the command zone, and the remaining 98 cards (or 58
//     cards in a Commander Draft game) of your deck are shuffled to become your library.
//   [2025-06-06] The triggered ability of the "partner with" keyword still triggers in a Commander
//     game. If your other commander has somehow ended up in your library, you can find it. You can
//     also target another player, whether or not they have that card in their library.
//   [2025-06-06] The second ability represented by the "partner with [name]" keyword modifies the
//     rules for deck construction in the Commander variant and has no function outside of that
//     variant. If a legendary creature card with "partner with [name]" is designated as your
//     commander, the named legendary creature card can also be designated as your commander.
//   [2025-06-06] Spells that were cast before Alphinaud Leveilleur entered count. If Alphinaud
//     Leveilleur was the first spell you cast this turn, the next spell you cast this turn is your
//     second spell.
//   [2025-06-06] Note that the target player searches their library (which may be affected by
//     effects such as that of Stranglehold) and that the card they find is revealed, even though
//     these words aren't included in the ability's reminder text.
//   [2025-06-06] To have two commanders, both must have the partner ability or corresponding
//     "partner with" abilities as the game begins. A creature with a "partner with" ability can't
//     partner with any creature other than its designated partner. Losing a partner ability during
//     the game doesn't cause either to cease to be your commander.
//   [2025-06-06] "Partner with [name]" represents two abilities. The first is a triggered ability:
//     "When this permanent enters, target player may search their library for a card named [name],
//     reveal it, put it into their hand, then shuffle."
//   [2025-06-06] Alphinaud Leveilleur's last ability resolves before the spell that caused it to
//     trigger. It resolves even if that spell is countered or otherwise leaves the stack.

// Eukrasia counts spells cast before Alphinaud entered (its ruling) — the
// cast-spell trigger's `nthEachTurn` reads the turn's whole count.
const EUKRASIA_TEXT = "Eukrasia — Whenever you cast your second spell each turn, draw a card.";

export default defineCard({
  name: "Alphinaud Leveilleur",
  manaCost: "{3}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Wizard"],
  power: 2,
  toughness: 4,
  keywords: ["vigilance"],
  pairing: { kind: "partner-with", name: "Alisaie Leveilleur" },
  text: `Partner with Alisaie Leveilleur (When this creature enters, target player may put Alisaie Leveilleur into their hand from their library, then shuffle.)\nVigilance\n${EUKRASIA_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: {
        kind: "search-library",
        filter: { name: "Alisaie Leveilleur" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
        who: { controllerOfTarget: 0 },
      },
      resolve: null,
      text: "When this creature enters, target player may search their library for a card named Alisaie Leveilleur, reveal it, put it into their hand, then shuffle.",
    },
    {
      trigger: { on: "cast-spell", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: EUKRASIA_TEXT,
    },
  ],
});
