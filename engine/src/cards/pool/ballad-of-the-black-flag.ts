import { defineCard } from "../define.js";

// Rulings:
//   [2024-07-05] A card, spell, or permanent is historic if it has the legendary supertype, the
//     artifact card type, or the Saga subtype.
//
// Historic is Arbaaz Mir's `anyOf`. The chapter I–III pick is from the cards
// this chapter milled (`thisWay: "milled"`, Smuggler's Surprise's shape), up to
// one. Chapter IV is a player effect for the rest of the turn (Rowan, Scion of
// War's `reduceSpells`), so it outlives the Saga's sacrifice.
const HISTORIC = { anyOf: [{ type: "artifact" }, { supertype: "legendary" }, { subtype: "Saga" }] } as const;
const MILL_TEXT =
  "I, II, III — Mill three cards. You may put a historic card from among them into your hand. (Artifacts, legendaries, and Sagas are historic.)";
const IV_TEXT = "IV — Historic spells you cast this turn cost {2} less to cast.";

export default defineCard({
  name: "Ballad of the Black Flag",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Saga"],
  text: `(As this Saga enters and after your draw step, add a lore counter. Sacrifice after IV.)\n${MILL_TEXT}\n${IV_TEXT}`,
  chapters: [
    {
      at: [1, 2, 3],
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 3 },
          {
            kind: "look-and-choose",
            zone: "graveyard",
            min: 0,
            max: 1,
            destination: "hand",
            leftover: "stay",
            filter: { thisWay: "milled", ...HISTORIC },
          },
        ],
      },
      resolve: null,
      text: MILL_TEXT,
    },
    {
      at: [4],
      targets: [],
      effect: {
        kind: "player-effect",
        duration: "end-of-turn",
        reduceSpells: { applies: HISTORIC, reduceGeneric: 2 },
      },
      resolve: null,
      text: IV_TEXT,
    },
  ],
});
