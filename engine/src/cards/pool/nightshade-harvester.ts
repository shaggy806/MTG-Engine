import { defineCard } from "../define.js";

// EDHREC rank 4560.

// "That player" is the land's controller — the trigger object's
// (`"trigger-controller"`, Polluted Bonds' shape).
const TEXT =
  "Whenever a land an opponent controls enters, that player loses 1 life. Put a +1/+1 counter on this creature.";

export default defineCard({
  name: "Nightshade Harvester",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "any",
        filter: { type: "land", controlledBy: "opponent" },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "trigger-controller" },
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
