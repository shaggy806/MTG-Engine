import { defineCard } from "../define.js";

// EDHREC rank 5552.
const LORD_TEXT = "Other Elves you control get +1/+1.";
const DIES_TEXT = "When this creature dies, return another target Elf card from your graveyard to your hand.";

export default defineCard({
  name: "Morcant's Loyalist",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 3,
  toughness: 2,
  text: `${LORD_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Elf" },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [{ kind: "other", of: { kind: "card-in-graveyard", whose: "you", filter: { subtype: "Elf" } } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
