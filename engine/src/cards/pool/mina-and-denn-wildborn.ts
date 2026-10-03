import { defineCard } from "../define.js";

// Returning the land is the cost, paid as the ability is activated, so it's
// too late by then to remove that land in response (the ruling); a land
// tapped for the {R}{G} may be the one returned.
const LAND_TEXT = "You may play an additional land on each of your turns.";
const TRAMPLE_TEXT =
  "{R}{G}, Return a land you control to its owner's hand: Target creature gains trample until end of turn.";

export default defineCard({
  name: "Mina and Denn, Wildborn",
  manaCost: "{2}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Ally"],
  power: 4,
  toughness: 4,
  text: `${LAND_TEXT}\n${TRAMPLE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      extraLandsPerTurn: 1,
      text: LAND_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{R}{G}", tap: false, returnToHand: { count: 1, filter: { type: "land" } } },
      targets: ["creature"],
      effect: { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      resolve: null,
      text: TRAMPLE_TEXT,
    },
  ],
});
