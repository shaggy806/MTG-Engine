import { defineCard } from "../define.js";

const ZOMBIE_TEXT = "{1}{B}, {T}, Discard a card: Create a 2/2 black Zombie creature token.";
const DRAW_TEXT = "Tap three untapped Zombies you control: You draw a card and lose 1 life.";

// Cryptbreaker is a Zombie, so it can be one of the three.
export default defineCard({
  name: "Cryptbreaker",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 1,
  text: `${ZOMBIE_TEXT}\n${DRAW_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{B}", tap: true, discard: { count: 1 } },
      targets: [],
      effect: { kind: "create-token", token: "Zombie Token", count: 1 },
      resolve: null,
      text: ZOMBIE_TEXT,
    },
    {
      cost: { mana: null, tap: false, tapOthers: { count: 3, filter: { subtype: "Zombie" }, includeSelf: true } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1, who: "you" },
        ],
      },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
