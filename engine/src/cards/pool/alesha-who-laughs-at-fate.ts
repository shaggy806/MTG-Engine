import { defineCard } from "../define.js";

const ATTACK_TEXT = "Whenever Alesha attacks, put a +1/+1 counter on it.";
const RAID_TEXT =
  "Raid — At the beginning of your end step, if you attacked this turn, return target creature card with mana value less than or equal to Alesha's power from your graveyard to the battlefield.";

// The target's mana value is checked against Alesha's power as it's chosen
// and again as the ability resolves (rule 608.2b), as she is then — or as
// she last existed.
export default defineCard({
  name: "Alesha, Who Laughs at Fate",
  manaCost: "{1}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 2,
  keywords: ["first-strike"],
  text: `First strike\n${ATTACK_TEXT}\n${RAID_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: ATTACK_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "turn-stat", stat: "attacked", who: "you", atLeast: 1 },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { type: "creature", manaValue: { op: "lte", n: { amount: { powerOf: "source" } } } },
        },
      ],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: RAID_TEXT,
    },
  ],
});
