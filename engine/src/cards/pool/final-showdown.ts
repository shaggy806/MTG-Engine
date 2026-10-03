import { defineCard } from "../define.js";

// Spree (rule 702.172a), the modes in printed order. The first mode reaches
// the creatures there as it resolves, so an ability granted afterwards — the
// second mode's indestructible included — isn't lost (rule 613.7, the
// ruling). The second mode's creature is chosen as it resolves, not
// targeted (the ruling): a hexproof one can be chosen, and nothing can
// respond to the choice.
export default defineCard({
  name: "Final Showdown",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Spree (Choose one or more additional costs.)\n" +
    "+ {1} — All creatures lose all abilities until end of turn.\n" +
    "+ {1} — Choose a creature you control. It gains indestructible until end of turn.\n" +
    "+ {3}{W}{W} — Destroy all creatures.",
  castModal: {
    minModes: 1,
    maxModes: 3,
    modes: [
      {
        text: "+ {1} — All creatures lose all abilities until end of turn.",
        spreeCost: "{1}",
        effect: { kind: "lose-abilities-all", filter: { type: "creature" }, duration: "end-of-turn" },
      },
      {
        text: "+ {1} — Choose a creature you control. It gains indestructible until end of turn.",
        spreeCost: "{1}",
        effect: {
          kind: "choose-permanents",
          filter: { type: "creature", controlledBy: "you" },
          min: 1,
          upTo: 1,
          prompt: "Choose a creature you control to gain indestructible until end of turn",
          then: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
        },
      },
      {
        text: "+ {3}{W}{W} — Destroy all creatures.",
        spreeCost: "{3}{W}{W}",
        effect: { kind: "destroy-all", filter: { type: "creature" } },
      },
    ],
  },
});
