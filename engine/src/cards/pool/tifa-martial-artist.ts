import { defineCard } from "../define.js";
import { melee } from "../helpers.js";

// #375 in top-commanders.txt.
//
// A batched damage trigger (once per player dealt damage). "If it's the first
// combat phase of your turn" is asked as it resolves; the additional combat
// comes straight after this one.
const MELEE_TEXT =
  "Melee (Whenever this creature attacks, it gets +1/+1 until end of turn for each opponent you attacked this combat.)";
const UNTAP_TEXT =
  "Whenever one or more creatures you control with power 7 or greater deal combat damage to a player, " +
  "untap all creatures you control. If it's the first combat phase of your turn, there is an " +
  "additional combat phase after this phase.";

export default defineCard({
  name: "Tifa, Martial Artist",
  manaCost: "{1}{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 4,
  toughness: 4,
  text: `${MELEE_TEXT}\n${UNTAP_TEXT}`,
  triggered: [
    melee(),
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { type: "creature", power: { op: "gte", n: 7 } },
        combat: true,
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap-all", filter: { type: "creature", controlledBy: "you" } },
          {
            kind: "conditional",
            condition: { kind: "turn-structure", combatPhase: 1 },
            then: { kind: "additional-combat", afterThisPhase: true },
          },
        ],
      },
      resolve: null,
      text: UNTAP_TEXT,
    },
  ],
});
