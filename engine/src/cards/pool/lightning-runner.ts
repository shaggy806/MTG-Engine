import { defineCard } from "../define.js";

// EDHREC rank 4986.
//
// - The energy is got first, so the two it gives count toward the eight
//   (the "then you may pay"). Paying is a resolution-time `may` with
//   `costEnergy`, offered only with eight to pay; it can't be paid twice
//   (the energy rulings).
// - It untaps every creature you control, attacking or not (its ruling),
//   and "after this phase" is the additional combat straight after this
//   combat, with no main phase between (Combat Celebrant's shape).
const ATTACK_TEXT =
  "Whenever this creature attacks, you get {E}{E} (two energy counters), then you may pay eight {E}. If you pay, untap all creatures you control, and after this phase, there is an additional combat phase.";

export default defineCard({
  name: "Lightning Runner",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 2,
  keywords: ["double-strike", "haste"],
  text: `Double strike, haste\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "get-energy", amount: 2 },
          {
            kind: "may",
            prompt: "Pay eight {E} to untap all creatures you control and get an additional combat phase?",
            costEnergy: 8,
            effect: {
              kind: "sequence",
              effects: [
                { kind: "untap-all", filter: { type: "creature", controlledBy: "you" } },
                { kind: "additional-combat", afterThisPhase: true },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
