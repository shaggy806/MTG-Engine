import { defineCard } from "../define.js";

// EDHREC rank 5867.

const ENTER_TEXT = "When this creature enters, put three -1/-1 counters on target creature you control.";
const MANA_TEXT = "{T}, Remove a -1/-1 counter from this creature: Add one mana of any color.";

export default defineCard({
  name: "Channeler Initiate",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 3,
  toughness: 4,
  text: `${ENTER_TEXT}\n${MANA_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true, removeCounter: { kind: "-1/-1", count: 1 } },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "-1/-1", amount: 3 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
