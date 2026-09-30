import { defineCard } from "../define.js";

const ENTER_TEXT =
  "When this enchantment enters, earthbend 2. Then search your library for a basic land card, put it onto the battlefield tapped, then shuffle.";
const LANDFALL_TEXT =
  "Landfall — Whenever a land you control enters, put a quest counter on this enchantment. When you do, if it has four or more quest counters on it, put a +1/+1 counter on target creature you control. It gains trample until end of turn.";
const WHEN_YOU_DO =
  "When you do, if it has four or more quest counters on it, put a +1/+1 counter on target creature you control. It gains trample until end of turn.";
const FOUR_QUEST = { kind: "self-counters", counter: "quest", compare: { op: "gte", n: 4 } } as const;

// - The land the search finds isn't on the battlefield as earthbend's target
//   is chosen (the ruling); with that target gone, the ability does nothing.
// - "When you do" needs the counter put: nothing modeled stops a counter
//   going on, so an enchantment still on the battlefield gets it. The
//   intervening-if is checked as the reflexive ability triggers and again as
//   it resolves (rule 603.4).
export default defineCard({
  name: "Earthbender Ascension",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${ENTER_TEXT}\n${LANDFALL_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["land-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "earthbend", target: 0, amount: 2 },
          {
            kind: "search-library",
            filter: { type: "land", supertype: "basic" },
            destination: "battlefield",
            enterTapped: true,
            min: 0,
            max: 1,
          },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "quest", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "all", of: [{ kind: "source-on-battlefield" }, FOUR_QUEST] },
            then: {
              kind: "reflexive-trigger",
              targets: ["creature-you-control"],
              effect: {
                kind: "conditional",
                condition: FOUR_QUEST,
                then: {
                  kind: "sequence",
                  effects: [
                    { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
                    { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
                  ],
                },
              },
              text: WHEN_YOU_DO,
            },
          },
        ],
      },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
