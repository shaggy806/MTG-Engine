import { defineCard } from "../define.js";

const ENTER_TEXT = "When this creature enters, create a 0/1 white Goat creature token.";
const SCRY_TEXT = "Sacrifice another creature: Scry 1.";

export default defineCard({
  name: "Woe Strider",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 3,
  toughness: 2,
  text:
    `${ENTER_TEXT}\n${SCRY_TEXT}\n` +
    "Escape—{3}{B}{B}, Exile four other cards from your graveyard. (You may cast this card from your graveyard for its escape cost.)\n" +
    "This creature escapes with two +1/+1 counters on it.",
  escape: { cost: "{3}{B}{B}", exileCount: 4, counters: { kind: "+1/+1", amount: 2 } },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Goat Token", count: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      otherOnly: true,
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: SCRY_TEXT,
    },
  ],
});
