import { defineCard } from "../define.js";

/** The disturb back face of Lunarch Veteran. Its "exile it instead" is the
 * face's own ability (`self` — rule 702.146), so a copy of it has it too. */
export default defineCard({
  name: "Luminous Phantom",
  // A back face has no Scryfall card of its own name — point at its art.
  art: "https://cards.scryfall.io/art_crop/back/4/3/438e3302-daf9-436b-8b08-24b3f33295f6.jpg",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Cleric"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "Whenever another creature you control leaves the battlefield, you gain 1 life.\n" +
    "If Luminous Phantom would be put into a graveyard from anywhere, exile it instead.",
  faces: ["Lunarch Veteran", "Luminous Phantom"],
  transform: true,
  disturb: { cost: "{1}{W}" },
  triggered: [
    {
      // Matched against the creature as it last existed (rule 603.10a).
      trigger: {
        on: "leaves-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever another creature you control leaves the battlefield, you gain 1 life.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-be-put-into-graveyard", instead: "exile", self: true },
      text: "If Luminous Phantom would be put into a graveyard from anywhere, exile it instead.",
    },
  ],
});
