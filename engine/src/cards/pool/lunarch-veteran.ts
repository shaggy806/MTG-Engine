import { defineCard } from "../define.js";

/** Disturb (rule 702.146): cast the front face normally, or the back face
 * (`Luminous Phantom`) from your graveyard for its disturb cost. */
export default defineCard({
  name: "Lunarch Veteran",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text:
    "Whenever another creature you control enters, you gain 1 life.\n" +
    "Disturb {1}{W} (You may cast this card from your graveyard transformed for its disturb cost.)",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever another creature you control enters, you gain 1 life.",
    },
  ],
  faces: ["Lunarch Veteran", "Luminous Phantom"],
  transform: true,
  disturb: { cost: "{1}{W}" },
});
