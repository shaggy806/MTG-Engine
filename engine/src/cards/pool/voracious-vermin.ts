import { defineCard } from "../define.js";

// EDHREC rank 6131.

const ETB_TEXT = 'When this creature enters, create a 1/1 black Rat creature token with "This token can\'t block."';
const DIES_TEXT = "Whenever another creature you control dies, put a +1/+1 counter on this creature.";

export default defineCard({
  name: "Voracious Vermin",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Rat"],
  power: 2,
  toughness: 1,
  text: `${ETB_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Rat Token (Can't Block)", count: 1 },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
