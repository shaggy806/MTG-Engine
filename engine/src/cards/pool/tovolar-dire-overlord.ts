import { defineCard } from "../define.js";

const DRAW_TEXT = "Whenever a Wolf or Werewolf you control deals combat damage to a player, draw a card.";
const NIGHT_TEXT =
  "At the beginning of your upkeep, if you control three or more Wolves and/or Werewolves, it becomes " +
  "night. Then transform any number of Human Werewolves you control.";

const HUMAN_WEREWOLF = { subtype: "Human", anyOf: [{ subtype: "Werewolf" }], controlledBy: "you" } as const;

// "Any number of Human Werewolves" is chosen on the board as the ability
// resolves (untargeted). A daybound or nightbound one can't be transformed
// by it (rules 702.145b/e — the ruling: it's for older Innistrad Werewolves),
// so those are left out of the choice; one that isn't a double-faced card
// can be chosen and doesn't transform. A creature that's a Wolf and a
// Werewolf triggers the first ability once (the ruling).
export default defineCard({
  name: "Tovolar, Dire Overlord",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Werewolf"],
  power: 3,
  toughness: 3,
  keywords: ["daybound"],
  text: `${DRAW_TEXT}\n${NIGHT_TEXT}\nDaybound (If a player casts no spells during their own turn, it becomes night next turn.)`,
  triggered: [
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { type: "creature", subtypes: ["Wolf", "Werewolf"] },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "controls", filter: { subtypes: ["Wolf", "Werewolf"] }, atLeast: 3 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "day-night", value: "night" },
          {
            kind: "choose-permanents",
            filter: { ...HUMAN_WEREWOLF, notKeyword: "daybound" },
            upTo: { countOf: { ...HUMAN_WEREWOLF, notKeyword: "daybound" } },
            then: { kind: "transform", target: 0 },
            prompt: "Transform any number of Human Werewolves you control",
          },
        ],
      },
      resolve: null,
      text: NIGHT_TEXT,
    },
  ],
  faces: ["Tovolar, Dire Overlord", "Tovolar, the Midnight Scourge"],
  transform: true,
});
