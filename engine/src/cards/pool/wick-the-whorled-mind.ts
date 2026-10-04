import { defineCard } from "../define.js";

const ENTER_TEXT =
  "Whenever Wick or another Rat you control enters, create a 1/1 black Snail creature token if you don't " +
  "control a Snail. Otherwise, put a +1/+1 counter on a Snail you control.";
const SAC_TEXT =
  "{U}{B}{R}, Sacrifice a Snail: Wick deals damage equal to the sacrificed creature's power to each " +
  "opponent. Then draw cards equal to the sacrificed creature's power.";

// Whether you control a Snail is read as the ability resolves; with two or
// more, you choose which gets the counter (untargeted). The sacrificed
// Snail's power is as it last existed on the battlefield (the ruling).
export default defineCard({
  name: "Wick, the Whorled Mind",
  manaCost: "{3}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Rat", "Warlock"],
  power: 2,
  toughness: 4,
  text: `${ENTER_TEXT}\n${SAC_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Rat" } },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "controls", filter: { subtype: "Snail" }, atLeast: 1 },
        then: {
          kind: "choose-permanents",
          filter: { subtype: "Snail", controlledBy: "you" },
          min: 1,
          upTo: 1,
          then: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          prompt: "Put a +1/+1 counter on a Snail you control",
        },
        else: { kind: "create-token", token: "Snail Token", count: 1 },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{U}{B}{R}", tap: false, sacrifice: { filter: { subtype: "Snail", controlledBy: "you" } } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: { powerOf: "sacrificed" }, who: "each-opponent" },
          { kind: "draw", amount: { powerOf: "sacrificed" } },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
