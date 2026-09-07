import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 10 — the reference Saga. Enters with a lore counter (chapter I
 * fires); another comes at the start of its controller's precombat main phase.
 * After chapter III's ability leaves the stack an SBA sacrifices it.
 */
export default defineCard({
  name: "History of Benalia",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Saga"],
  text: "(As this Saga enters and after your draw step, add a lore counter.)\nI, II — Create a 2/2 white Knight creature token with vigilance.\nIII — Knights you control get +2/+1 until end of turn.",
  chapters: [
    {
      at: [1, 2],
      targets: [],
      effect: { kind: "create-token", token: "Knight Token", count: 1 },
      resolve: null,
      text: "I, II — Create a 2/2 white Knight creature token with vigilance.",
    },
    {
      at: [3],
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { subtype: "Knight", controlledBy: "you" },
        power: 2,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "III — Knights you control get +2/+1 until end of turn.",
    },
  ],
});
