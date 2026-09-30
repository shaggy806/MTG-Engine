import { defineCard } from "../define.js";

const WALL_TEXT = "Whenever this creature enters or attacks, create a 1/3 white Wall creature token with defender.";
const LAND_TEXT =
  "Whenever a creature you control with defender dies, you may search your library for a basic land card, put that card onto the battlefield tapped, then shuffle.";
const WALL = { kind: "create-token", token: "Wall Token", count: 1 } as const;

export default defineCard({
  name: "Rampart Architect",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elephant", "Advisor"],
  power: 3,
  toughness: 4,
  text: `${WALL_TEXT}\n${LAND_TEXT}`,
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect: WALL, resolve: null, text: WALL_TEXT },
    { trigger: { on: "attacks", who: "self" }, targets: [], effect: WALL, resolve: null, text: WALL_TEXT },
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature", keyword: "defender" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search for a basic land card?",
        effect: {
          kind: "search-library",
          filter: { type: "land", supertype: "basic" },
          destination: "battlefield",
          enterTapped: true,
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text: LAND_TEXT,
    },
  ],
});
