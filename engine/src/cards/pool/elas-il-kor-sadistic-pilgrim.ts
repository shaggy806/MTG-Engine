import { defineCard } from "../define.js";

// "Another creature you control dies" is matched against the creature as it
// last existed on the battlefield (rule 603.10a): an animated land counts,
// and one that died alongside Elas still triggers her.
export default defineCard({
  name: "Elas il-Kor, Sadistic Pilgrim",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Kor", "Cleric"],
  power: 2,
  toughness: 2,
  keywords: ["deathtouch"],
  text:
    "Deathtouch\n" +
    "Whenever another creature you control enters, you gain 1 life.\n" +
    "Whenever another creature you control dies, each opponent loses 1 life.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { type: "creature" },
      },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever another creature you control enters, you gain 1 life.",
    },
    {
      trigger: { on: "dies", who: "you-control", otherOnly: true, filter: { type: "creature" } },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever another creature you control dies, each opponent loses 1 life.",
    },
  ],
});
