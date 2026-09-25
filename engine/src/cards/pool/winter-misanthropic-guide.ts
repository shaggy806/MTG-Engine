import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// #323 in top-commanders.txt.
const DRAW_TEXT = "At the beginning of your upkeep, each player draws two cards.";
const DELIRIUM_TEXT =
  "Delirium — As long as there are four or more card types among cards in your graveyard, each " +
  "opponent's maximum hand size is equal to seven minus the number of those card types.";
const WARD = ward({ mana: "{2}" });

export default defineCard({
  name: "Winter, Misanthropic Guide",
  manaCost: "{1}{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 3,
  toughness: 4,
  text: `${WARD.text}\n${DRAW_TEXT}\n${DELIRIUM_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "delirium" },
      maxHandSize: { who: "opponents", set: 7, minus: { cardTypesInGraveyard: { ownedBy: "you" } } },
      text: DELIRIUM_TEXT,
    },
  ],
  triggered: [
    WARD,
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "draw", amount: 2, who: "each-player" },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
