import { defineCard } from "../define.js";

const DAMAGE_TEXT = "Whenever one or more creatures you control deal combat damage to one or more players, proliferate.";
const CORRUPTED_TEXT =
  "Corrupted — At the beginning of your end step, if an opponent has three or more poison counters, draw a " +
  "card, then you may put a land card from your hand onto the battlefield.";

// "To one or more players" is once for the whole damage event however many
// players were dealt damage (`once: "per-event"`); first-strike and regular
// damage are two events (rule 510.4).
export default defineCard({
  name: "Contaminant Grafter",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Druid"],
  power: 5,
  toughness: 5,
  keywords: ["trample"],
  toxic: 1,
  text: `Trample, toxic 1\n${DAMAGE_TEXT}\n${CORRUPTED_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { type: "creature" },
        to: "player",
        combat: true,
        once: "per-event",
      },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: DAMAGE_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "player-counters", counter: "poison", who: "opponent", atLeast: 3 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          {
            kind: "look-and-choose",
            zone: "hand",
            min: 0,
            max: 1,
            destination: "battlefield",
            leftover: "stay",
            filter: { type: "land" },
          },
        ],
      },
      resolve: null,
      text: CORRUPTED_TEXT,
    },
  ],
});
