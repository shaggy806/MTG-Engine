import { defineCard } from "../define.js";

// Back face of Jugan Defends the Temple.

const ENTER_TEXT =
  "Whenever another creature you control enters, you may pay {X}. When you do, put X +1/+1 counters on that creature.";
const STATIC_TEXT =
  "As long as you control five or more modified creatures, this creature gets +5/+5 and has trample.";

export default defineCard({
  name: "Remnant of the Rising Star",
  art: "https://cards.scryfall.io/art_crop/back/a/2/a22b5f27-f9e7-49e1-8e96-dc5d8e7fbe27.jpg",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Dragon", "Spirit"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${ENTER_TEXT}\n${STATIC_TEXT} (Equipment, Auras you control, and counters are modifications.)`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      // Rose Room Treasurer's shape: a `may` paying {X}, its reflexive
      // trigger reading that X; "that creature" is the trigger object.
      effect: {
        kind: "may",
        prompt: "Pay {X} to put X +1/+1 counters on that creature?",
        cost: "{X}",
        effect: {
          kind: "reflexive-trigger",
          targets: [],
          effect: { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: "x" },
          text: "When you do, put X +1/+1 counters on that creature.",
        },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "controls", filter: { type: "creature", modified: true }, atLeast: 5 },
      grantPt: [5, 5],
      grantKeywords: ["trample"],
      text: STATIC_TEXT,
    },
  ],
  faces: ["Jugan Defends the Temple", "Remnant of the Rising Star"],
  transform: true,
});
