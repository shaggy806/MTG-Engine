import { defineCard } from "../define.js";

// Top-commanders rank 447.
//
// The upkeep clause is printed as "you may return **target** creature card
// from your graveyard to your hand". The engine has the `card-in-graveyard`
// target spec but no *effect* that moves a targeted graveyard card to a hand
// (`return-to-hand` bails on anything not on the battlefield), so this is the
// same non-targeted `return-from-graveyard` modelling Eternal Witness, Buried
// Ruin and Kolaghan's Command use for that clause: the controller picks the
// card as the trigger resolves rather than as it goes on the stack. Two
// observable differences follow — the trigger goes on the stack even with no
// creature card in the graveyard (rule 603.3d would hold it back), and it
// can't fizzle to rule 608.2b if an opponent exiles the chosen card in
// response.
export default defineCard({
  name: "Ravos, Soultender",
  manaCost: "{3}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 2,
  pairing: { kind: "partner" },
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Other creatures you control get +1/+1.\n" +
    "At the beginning of your upkeep, you may return target creature card from your " +
    "graveyard to your hand.\n" +
    "Partner (You can have two commanders if both have partner.)",
  static: [
    {
      // "*Other* creatures you control" — Ravos itself stays a 2/2.
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantPt: [1, 1],
      text: "Other creatures you control get +1/+1.",
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: {
        kind: "may",
        prompt: "Return the target creature card to your hand?",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text:
        "At the beginning of your upkeep, you may return target creature card from your " +
        "graveyard to your hand.",
    },
  ],
});
