import { defineCard } from "../define.js";

// Spree (rule 702.172a), the modes in printed order. The third mode reaches
// the creatures you control as it resolves — the second mode's included,
// if their power is 4 or greater (the ruling).
export default defineCard({
  name: "Smuggler's Surprise",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Spree (Choose one or more additional costs.)\n" +
    "+ {2} — Mill four cards. You may put up to two creature and/or land cards from among the milled cards into your hand.\n" +
    "+ {4}{G} — You may put up to two creature cards from your hand onto the battlefield.\n" +
    "+ {1} — Creatures you control with power 4 or greater gain hexproof and indestructible until end of turn.",
  castModal: {
    minModes: 1,
    maxModes: 3,
    modes: [
      {
        text: "+ {2} — Mill four cards. You may put up to two creature and/or land cards from among the milled cards into your hand.",
        spreeCost: "{2}",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "mill", target: "you", amount: 4 },
            {
              kind: "look-and-choose",
              zone: "graveyard",
              min: 0,
              max: 2,
              destination: "hand",
              leftover: "stay",
              filter: { thisWay: "milled", typesAnyOf: ["creature", "land"] },
            },
          ],
        },
      },
      {
        text: "+ {4}{G} — You may put up to two creature cards from your hand onto the battlefield.",
        spreeCost: "{4}{G}",
        effect: {
          kind: "look-and-choose",
          zone: "hand",
          min: 0,
          max: 2,
          destination: "battlefield",
          leftover: "stay",
          filter: { type: "creature" },
        },
      },
      {
        text: "+ {1} — Creatures you control with power 4 or greater gain hexproof and indestructible until end of turn.",
        spreeCost: "{1}",
        effect: {
          kind: "sequence",
          effects: [
            {
              kind: "grant-keyword-all",
              filter: { type: "creature", controlledBy: "you", power: { op: "gte", n: 4 } },
              keyword: "hexproof",
              duration: "end-of-turn",
            },
            {
              kind: "grant-keyword-all",
              filter: { type: "creature", controlledBy: "you", power: { op: "gte", n: 4 } },
              keyword: "indestructible",
              duration: "end-of-turn",
            },
          ],
        },
      },
    ],
  },
});
