import { defineCard } from "../define.js";

const ATTACK_TEXT =
  "Whenever Venom attacks, you may sacrifice another creature. If you do, draw X cards, then you may put a " +
  "permanent card with mana value X or less from your hand onto the battlefield, where X is the sacrificed " +
  "creature's mana value.";

// The back face of Eddie Brock. X is the sacrificed creature's mana value as
// it last existed on the battlefield (a modal DFC's is its face up there).
// The cards drawn can be the one put onto the battlefield; a modal DFC in
// hand is judged by its front face and enters front face up (the rulings).
const X = { manaValueOf: "sacrificed" } as const;

/** The back face of Eddie Brock. */
export default defineCard({
  name: "Venom, Lethal Protector",
  // A back face has no Scryfall card of its own name — point at its art.
  art: "https://cards.scryfall.io/art_crop/back/f/3/f3455651-e643-445e-9489-51e4e24fca4c.jpg",
  manaCost: "{3}{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Symbiote", "Hero", "Villain"],
  power: 5,
  toughness: 5,
  keywords: ["menace", "trample", "haste"],
  text: `Menace, trample, haste\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "you",
        options: [{ sacrifice: { type: "creature" }, exceptSource: true, text: "Sacrifice another creature" }],
        ifDid: {
          kind: "sequence",
          effects: [
            { kind: "draw", amount: X },
            {
              kind: "look-and-choose",
              zone: "hand",
              min: 0,
              max: 1,
              destination: "battlefield",
              leftover: "stay",
              filter: {
                typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"],
                manaValue: { op: "lte", n: { amount: X } },
              },
            },
          ],
        },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  faces: ["Eddie Brock", "Venom, Lethal Protector"],
});
