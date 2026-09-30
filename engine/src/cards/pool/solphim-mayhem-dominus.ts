import { defineCard } from "../define.js";

const DOUBLE_TEXT =
  "If a source you control would deal noncombat damage to an opponent or a permanent an opponent controls, it deals double that damage to that player or permanent instead.";
const COUNTER_TEXT =
  "{1}{R/P}{R/P}, Discard two cards: Put an indestructible counter on Solphim. ({R/P} can be paid with either {R} or 2 life.)";

export default defineCard({
  name: "Solphim, Mayhem Dominus",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Horror"],
  power: 5,
  toughness: 4,
  text: `${DOUBLE_TEXT}\n${COUNTER_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-deal-damage",
        multiplier: 2,
        combat: false,
        source: { controlledBy: "you" },
        to: "opponent-side",
      },
      text: DOUBLE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{R/P}{R/P}", tap: false, discard: { count: 2 } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "indestructible", amount: 1 },
      resolve: null,
      text: COUNTER_TEXT,
    },
  ],
});
