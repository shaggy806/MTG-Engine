import { defineCard } from "../define.js";

// #362 in top-commanders.txt.
const MILL_TEXT = "Whenever Sidisi enters or attacks, mill three cards.";
const ZOMBIE_TEXT =
  "Whenever one or more creature cards are put into your graveyard from your library, create a 2/2 " +
  "black Zombie creature token.";
const mill = { kind: "mill", target: "you", amount: 3 } as const;

export default defineCard({
  name: "Sidisi, Brood Tyrant",
  manaCost: "{1}{B}{G}{U}",
  colors: ["B", "G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Snake", "Shaman"],
  power: 3,
  toughness: 3,
  text: `${MILL_TEXT}\n${ZOMBIE_TEXT}`,
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect: mill, resolve: null, text: MILL_TEXT },
    { trigger: { on: "attacks", who: "self" }, targets: [], effect: mill, resolve: null, text: MILL_TEXT },
    {
      trigger: { on: "put-into-graveyard", who: "you", from: "library", filter: { type: "creature" }, batched: true },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1 },
      resolve: null,
      text: ZOMBIE_TEXT,
    },
  ],
});
