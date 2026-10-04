import { defineCard } from "../define.js";

// EDHREC rank 5381.
//
// Rulings:
//   [2004-10-04] You do not have to find an enchantment card if you do not want to, even if you
//     have one in your library.
//   [2005-08-01] An enchantment card is any Enchantment card, including Auras.
// Greenwarden of Murasa's "you may exile it. If you do" shape; an Aura found
// chooses what it enchants as it enters (Zur the Enchanter's search).

const TEXT =
  "When this creature dies, you may exile it. If you do, search your library for an enchantment card, put that card onto the battlefield, then shuffle.";

export default defineCard({
  name: "Academy Rector",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Exile Academy Rector to search your library for an enchantment card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "exile", target: "trigger-object" },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "exiled" },
              then: {
                kind: "search-library",
                filter: { type: "enchantment" },
                destination: "battlefield",
                min: 0,
                max: 1,
              },
            },
          ],
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
