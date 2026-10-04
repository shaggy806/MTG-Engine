import { defineCard } from "../define.js";

// EDHREC rank 3103.
// Makes Treasure → use "Treasure Token".

const COUNTER_TEXT = "Whenever another legendary creature you control enters, put a +1/+1 counter on Gimli.";
const TREASURE_TEXT = "Whenever Gimli deals combat damage to a player, create a Treasure token.";

export default defineCard({
  name: "Gimli of the Glittering Caves",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dwarf", "Warrior"],
  power: 1,
  toughness: 1,
  keywords: ["double-strike"],
  text: `Double strike\n${COUNTER_TEXT}\n${TREASURE_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { supertype: "legendary", type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: COUNTER_TEXT,
    },
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TREASURE_TEXT,
    },
  ],
});
