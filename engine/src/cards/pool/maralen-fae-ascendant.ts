import { defineCard } from "../define.js";
import { thisOrAnother } from "../helpers.js";

// #55 in top-commanders.txt.
//
// The permission is Maralen's static ability over what she exiled, so it's
// the exile's `impulse-exile` with `whileSource` — gone once she leaves —
// and `oncePerTurn`, one cast a turn across every card she exiled. The mana
// value cap counts Elves and Faeries you control live, as the spell is cast.
// A card cast this way is yours on the stack and on the battlefield (rules
// 601.2a, 608.3a); it goes to its owner's graveyard.
const ENTERS_TEXT =
  "Whenever Maralen or another Elf or Faerie you control enters, exile the top two cards of target opponent's library.";
const CAST_TEXT =
  "Once each turn, you may cast a spell with mana value less than or equal to the number of Elves and Faeries " +
  "you control from among cards exiled with Maralen this turn without paying its mana cost.";

export default defineCard({
  name: "Maralen, Fae Ascendant",
  manaCost: "{2}{B}{G}{U}",
  colors: ["U", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Faerie", "Noble"],
  power: 4,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${ENTERS_TEXT}\n${CAST_TEXT}`,
  triggered: [
    ...thisOrAnother({
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtypes: ["Elf", "Faerie"] } },
      targets: ["opponent"],
      effect: {
        kind: "impulse-exile",
        amount: 2,
        whose: 0,
        duration: "end-of-turn",
        castOnly: true,
        filter: {
          manaValue: {
            op: "lte",
            n: { amount: { countOf: { subtypes: ["Elf", "Faerie"], controlledBy: "you" } } },
          },
        },
        free: { only: true },
        whileSource: true,
        oncePerTurn: true,
      },
      resolve: null,
      text: ENTERS_TEXT,
    }),
  ],
});
