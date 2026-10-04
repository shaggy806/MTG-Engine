import { ward } from "../helpers.js";
import { defineCard } from "../define.js";

// EDHREC rank 6082.
//
// Rulings:
//   [2021-04-16]  If an effect creates a copy of an instant or sorcery spell, this will also cause
//     the magecraft ability to trigger.
//   [2021-04-16]  Some effects instruct you to copy an instant or sorcery card in a zone other
//     than the stack. These copies do not cause magecraft abilities to trigger. However, most
//     effects that do this also allow you to cast the copy, and casting the copy will cause
//     magecraft abilities to trigger.
//   [2021-04-16]  If an effect creates multiple copies of an instant or sorcery spell, magecraft
//     abilities trigger once for each copy created by the effect.
//
// The base 8/8 is a layer-7b set (`animate` adding no types — Azure
// Beastbinder's shape), so counters and pumps still apply on top.
const REDUCE_TEXT =
  "This spell costs {8} less to cast if you have eight or more instant and/or sorcery cards in your graveyard.";
const MAGECRAFT_TEXT =
  "Magecraft — Whenever you cast or copy an instant or sorcery spell, target creature has base power and toughness 8/8 until end of turn.";

export default defineCard({
  name: "Octavia, Living Thesis",
  manaCost: "{8}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Octopus"],
  power: 8,
  toughness: 8,
  text: `${REDUCE_TEXT}\nWard {8}\n${MAGECRAFT_TEXT}`,
  selfCostReduction: {
    condition: { kind: "cards-in-graveyard", atLeast: 8, filter: { typesAnyOf: ["instant", "sorcery"] } },
    reduceGeneric: 8,
  },
  triggered: [
    ward({ mana: "{8}" }),
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        orCopy: true,
        filter: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: ["creature"],
      effect: {
        kind: "animate",
        target: 0,
        power: 8,
        toughness: 8,
        addTypes: [],
        addSubtypes: [],
        duration: "end-of-turn",
      },
      resolve: null,
      text: MAGECRAFT_TEXT,
    },
  ],
});
