import { defineCard } from "../define.js";

// EDHREC rank 6276.
// Makes Alien Warrior → new token "Alien Warrior Token" (scaffolded).
//
// Rulings:
//   [2023-10-13] An instant or sorcery that counts how many spells you've cast from anywhere other
//     than your hand, such as Surge of Brilliance, counts itself if it was cast from a zone other
//     than your hand.
//   [2023-10-13] A triggered ability that triggers when a spell is cast from anywhere other than
//     your hand, such as that of The Thirteenth Doctor, functions only on the battlefield, so it
//     doesn't trigger when you cast that spell from a zone other than your hand.
//   [2023-10-13] Paradox abilities count any spells cast from zones other than your hand. These
//     are usually spells cast from exile, the graveyard, or the command zone. They also count
//     spells cast from outside the game, such as spells cast with Wish or Garth One-Eye's ability.
//   [2023-10-13] If a spell or ability allows you to copy a spell on the stack but doesn't specify
//     that the spell is cast, that spell wasn't cast and won't be counted by paradox abilities.
//     However, if a spell or ability allows you to cast a copy of a spell, that spell will be
//     counted for paradox abilities.

export default defineCard({
  name: "Iraxxa, Empress of Mars",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Alien", "Warrior"],
  power: 5,
  toughness: 4,
  keywords: ["trample"],
  text: "Trample\nBattle cry (Whenever this creature attacks, each other attacking creature gets +1/+0 until end of turn.)\nParadox — Whenever you cast a spell from anywhere other than your hand, create a 2/2 red Alien Warrior creature token.",
  triggered: [
    {
      // Battle cry — Hero of Bladehold's shape.
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", attacking: true },
        power: 1,
        toughness: 0,
        duration: "end-of-turn",
        exceptSource: true,
      },
      resolve: null,
      text: "Battle cry (Whenever this creature attacks, each other attacking creature gets +1/+0 until end of turn.)",
    },
    {
      // Paradox — Flaming Tyrannosaurus's trigger.
      trigger: { on: "cast-spell", who: "you", notFrom: "hand" },
      targets: [],
      effect: { kind: "create-token", token: "Alien Warrior Token", count: 1 },
      resolve: null,
      text: "Paradox — Whenever you cast a spell from anywhere other than your hand, create a 2/2 red Alien Warrior creature token.",
    },
  ],
});
