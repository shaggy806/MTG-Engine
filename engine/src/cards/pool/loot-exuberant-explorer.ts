import { defineCard } from "../define.js";

const LAND_TEXT = "You may play an additional land on each of your turns.";
const LOOK_TEXT =
  "{4}{G}{G}, {T}: Look at the top six cards of your library. You may reveal a creature card with mana value less than or equal to the number of lands you control from among them and put it onto the battlefield. Put the rest on the bottom in a random order.";

export default defineCard({
  name: "Loot, Exuberant Explorer",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Beast", "Noble"],
  power: 1,
  toughness: 4,
  text: `${LAND_TEXT}\n${LOOK_TEXT}`,
  static: [{ affects: { scope: "self" }, extraLandsPerTurn: 1, text: LAND_TEXT }],
  activated: [
    {
      cost: { mana: "{4}{G}{G}", tap: true },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 6,
        min: 0,
        max: 1,
        filter: {
          type: "creature",
          manaValue: { op: "lte", n: { amount: { countOf: { type: "land", controlledBy: "you" } } } },
        },
        destination: "battlefield",
        leftover: "bottom-random",
      },
      resolve: null,
      text: LOOK_TEXT,
    },
  ],
});
