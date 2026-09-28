import { defineCard } from "../define.js";

// Her power is a characteristic-defining ability (rule 604.3): it counts
// herself while she's a creature on the battlefield. The tokens come for each
// opponent, attacked or not (ruling), each attacking that player or a
// planeswalker they control (rule 508.4) — asked only where there's a choice.
const POWER_TEXT = "Adeline's power is equal to the number of creatures you control.";
const ATTACK_TEXT =
  "Whenever you attack, for each opponent, create a 1/1 white Human creature token that's tapped and attacking that player or a planeswalker they control.";

export default defineCard({
  name: "Adeline, Resplendent Cathar",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 0,
  toughness: 4,
  keywords: ["vigilance"],
  text: `Vigilance\n${POWER_TEXT}\n${ATTACK_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { type: "creature", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
        only: "power",
      },
      text: POWER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [],
      effect: {
        kind: "for-each-player",
        who: "each-opponent",
        effect: {
          kind: "create-token",
          token: "Human Token",
          count: 1,
          tapped: true,
          attacking: { player: "that-player", orTheirPlaneswalker: true },
        },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
