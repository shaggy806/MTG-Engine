import { defineCard } from "../define.js";

// EDHREC commander rank 321. A land-count CDA plus a self-mill that returns
// lands, both on existing vocabulary:
//
// - The CDA is `setBasePtFromCount` with a `{ countOf }` filter. It works in
//   every zone (rule 604.3), so Lumra in hand, graveyard or the command zone
//   is as big as its owner's land count; on the battlefield a token stack of
//   land tokens counts every token in it (`permanentCount`).
// - The ETB is a `sequence`: mill four, *then* return every land card from
//   your graveyard — which includes the lands just milled, and ones that were
//   there already. Being one ability, nothing can happen in between. The
//   returned lands enter tapped, and Lumra's P/T rises with them at once.
const CDA_TEXT = "Lumra's power and toughness are each equal to the number of lands you control.";
const ETB_TEXT =
  "When Lumra enters, mill four cards. Then return all land cards from your graveyard to " +
  "the battlefield tapped.";

export default defineCard({
  name: "Lumra, Bellow of the Woods",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Bear"],
  power: 0,
  toughness: 0,
  keywords: ["vigilance", "reach"],
  text: `Vigilance, reach\n${CDA_TEXT}\n${ETB_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { type: "land", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
      },
      text: CDA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 4 },
          {
            kind: "return-from-graveyard",
            filter: { type: "land" },
            destination: "battlefield",
            count: "all",
            enterTapped: true,
          },
        ],
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
});
