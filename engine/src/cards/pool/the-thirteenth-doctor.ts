import { defineCard } from "../define.js";

// EDHREC rank 5103.
//
// Rulings:
//   [2023-10-13] Unlike other creature types in Magic that are each only one word, the two words
//     "Time Lord" represent a single creature subtype. Time Lord is the only two-word creature
//     type.
//   [2023-10-13] If a spell or ability allows you to copy a spell on the stack but doesn't specify
//     that the spell is cast, that spell wasn't cast and won't be counted by paradox abilities.
//     However, if a spell or ability allows you to cast a copy of a spell, that spell will be
//     counted for paradox abilities.
//   [2023-10-13] A triggered ability that triggers when a spell is cast from anywhere other than
//     your hand, such as that of The Thirteenth Doctor, functions only on the battlefield, so it
//     doesn't trigger when you cast that spell from a zone other than your hand.
//   [2023-10-13] Paradox abilities count any spells cast from zones other than your hand. These
//     are usually spells cast from exile, the graveyard, or the command zone. They also count
//     spells cast from outside the game, such as spells cast with Wish or Garth One-Eye's ability.
//   [2023-10-13] The Thirteenth Doctor's last ability untaps creatures you control with any kind
//     of counter on them, not just creatures you control with +1/+1 counters on them.
//
// "Time Lord" is one subtype (the ruling, and the Doctor's-companion check in
// deck-validation.ts). Paradox is Flaming Tyrannosaurus's `notFrom: "hand"`.
const PARADOX_TEXT =
  "Paradox — Whenever you cast a spell from anywhere other than your hand, put a +1/+1 counter on target creature.";
const TARDIS_TEXT = "Team TARDIS — At the beginning of your end step, untap each creature you control with a counter on it.";

export default defineCard({
  name: "The Thirteenth Doctor",
  manaCost: "{1}{G}{U}",
  colors: ["U", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Time Lord", "Doctor"],
  power: 2,
  toughness: 2,
  text: `${PARADOX_TEXT}\n${TARDIS_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", notFrom: "hand" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: PARADOX_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "untap-all",
        filter: { type: "creature", controlledBy: "you", counters: { compare: { op: "gte", n: 1 } } },
      },
      resolve: null,
      text: TARDIS_TEXT,
    },
  ],
});
