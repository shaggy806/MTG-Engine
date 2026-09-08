import { defineCard } from "../define.js";

const youControlCreatures = { type: "creature", controlledBy: "you" } as const;

/**
 * ROADMAP Phase 11 EG-5 — a planeswalker with a **static anthem**. A
 * planeswalker source is scanned by `collectStaticEffects` like any other
 * battlefield permanent, so the +1/+1 applies (and turns off the moment
 * Rendwin leaves the battlefield). Made-up (real static-anthem planeswalkers
 * barely exist).
 */
export default defineCard({
  name: "Rendwin, Warden of the Grove",
  manaCost: "{2}{G}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Rendwin"],
  loyalty: 4,
  text:
    "Creatures you control get +1/+1.\n" +
    "[+1]: Create a 1/1 white Soldier creature token.\n" +
    "[-3]: Creatures you control gain trample until end of turn.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantPt: [1, 1],
      text: "Creatures you control get +1/+1.",
    },
  ],
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: 1 },
      resolve: null,
      text: "[+1]: Create a 1/1 white Soldier creature token.",
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: youControlCreatures,
        keyword: "trample",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "[-3]: Creatures you control gain trample until end of turn.",
    },
  ],
});
