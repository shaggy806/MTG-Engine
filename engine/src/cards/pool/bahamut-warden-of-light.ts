import { defineCard } from "../define.js";

// The back face of Dion, Bahamut's Dominant: a Saga creature.
//
// Rulings:
//   [2025-06-06] If the target permanent is an illegal target when Bahamut's third chapter ability
//     tries to resolve, it won't resolve and none of its effects will happen. You won't exile
//     Bahamut and return it to the battlefield front face up. Instead, when the ability leaves the
//     stack without resolving and state-based actions are checked, Bahamut will be sacrificed due
//     to having a number of lore counters greater than or equal to its final chapter number.
//
// - "Those creatures" are the ones the counters went on: each other creature
//   you control as the chapter resolves, read twice over the same board.
// - Chapter III's return is Ifrit, Warden of Inferno's: a flicker of the
//   source, which comes back front face up as Dion — a new object that's no
//   Saga, so nothing sacrifices it.
const WINGS_TEXT =
  "I, II — Wings of Light — Put a +1/+1 counter on each other creature you control. Those creatures gain " +
  "flying until end of turn.";
const GIGAFLARE_TEXT =
  "III — Gigaflare — Destroy target permanent. Exile Bahamut, then return it to the battlefield (front face up).";
const OTHERS = { type: "creature", controlledBy: "you" } as const;

export default defineCard({
  name: "Bahamut, Warden of Light",
  art: "https://cards.scryfall.io/art_crop/back/8/c/8c0f9306-2058-476d-a711-bd37a6e15e42.jpg",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Saga", "Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: `(As this Saga enters and after your draw step, add a lore counter.)\n${WINGS_TEXT}\n${GIGAFLARE_TEXT}\nFlying`,
  chapters: [
    {
      at: [1, 2],
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter-all", filter: OTHERS, counter: "+1/+1", amount: 1, exceptSource: true },
          { kind: "grant-keyword-all", filter: OTHERS, keyword: "flying", duration: "end-of-turn", exceptSource: true },
        ],
      },
      resolve: null,
      text: WINGS_TEXT,
    },
    {
      at: [3],
      targets: ["permanent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          { kind: "flicker", target: "source" },
        ],
      },
      resolve: null,
      text: GIGAFLARE_TEXT,
    },
  ],
  faces: ["Dion, Bahamut's Dominant", "Bahamut, Warden of Light"],
  transform: true,
});
