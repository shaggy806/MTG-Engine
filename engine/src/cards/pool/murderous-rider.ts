import { defineCard } from "../define.js";

const DIES_TEXT = "When this creature dies, put it on the bottom of its owner's library.";

// An adventurer card (rule 715): Swift End is the Adventure half. The dies
// trigger finds the card only in the graveyard it went to (rule 400.7).
export default defineCard({
  name: "Murderous Rider",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Knight"],
  power: 2,
  toughness: 3,
  keywords: ["lifelink"],
  text: `Lifelink\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "put-on-library", target: "trigger-object", position: "bottom" },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  faces: ["Murderous Rider", "Swift End"],
  adventure: true,
});
