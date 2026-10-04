import { defineCard } from "../define.js";

const TEXT =
  "Whenever a player attacks one of your opponents, if that opponent has more life than another of your " +
  "opponents, that attacking player draws a card and you put two +1/+1 counters on a creature you control.";

// The life comparison is an intervening-if, asked as players attack and
// again as the ability resolves (rule 603.4). The creature for the counters
// is chosen as it resolves (the ruling), untargeted, on the board; it still
// triggers, and the attacking player still draws, with no creature to choose.
export default defineCard({
  name: "Breena, the Demagogue",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird", "Warlock"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks-player", who: "any", defender: "opponent", defenderLife: "more-than-another-opponent" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1, who: "active-player" },
          {
            kind: "choose-permanents",
            filter: { type: "creature", controlledBy: "you" },
            min: 1,
            upTo: 1,
            then: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
            prompt: "Put two +1/+1 counters on a creature you control",
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
