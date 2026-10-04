import { defineCard } from "../define.js";

// EDHREC rank 4749.
//
// Rulings:
//   [2021-09-24] Heronblade Elite's last ability is a mana ability. It doesn't use the stack and
//     can't be responded to. If Heronblade Elite's power is 0 or less at the time the ability
//     resolves, no mana is added.
// The mana ability is Helga, Skittish Seer's: X of one chosen colour, X its power.
const MANA_TEXT = "{T}: Add X mana of any one color, where X is this creature's power.";
const GROW_TEXT = "Whenever another Human you control enters, put a +1/+1 counter on this creature.";

export default defineCard({
  name: "Heronblade Elite",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 1,
  toughness: 1,
  keywords: ["vigilance"],
  text: `Vigilance\n${GROW_TEXT}\n${MANA_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: { powerOf: "source" } },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Human" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GROW_TEXT,
    },
  ],
});
