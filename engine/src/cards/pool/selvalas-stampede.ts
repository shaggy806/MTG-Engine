import { defineCard } from "../define.js";

// A vote (rule 701.38): as it resolves, starting with its caster and in
// turn order, each player votes wild or free — each knowing the votes
// before theirs, nobody abstaining (the rulings). Every vote adds to the
// effect: the creature cards revealed for the wild votes enter together,
// then the permanent cards put from hand for the free votes (the rulings).
const TEXT =
  "Council's dilemma — Starting with you, each player votes for wild or free. Reveal cards from the top of your library until you reveal a creature card for each wild vote. Put those creature cards onto the battlefield, then shuffle the rest into your library. You may put a permanent card from your hand onto the battlefield for each free vote.";

const NOTHING = { kind: "sequence", effects: [] } as const;

export default defineCard({
  name: "Selvala's Stampede",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: TEXT,
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "each-player-may",
        who: "each-player",
        startingWithYou: true,
        choices: [
          { text: "Vote for wild", effect: NOTHING },
          { text: "Vote for free", effect: NOTHING },
        ],
      },
      { kind: "reveal-until-count", filter: { type: "creature" }, count: { votesFor: 0 }, rest: "shuffle" },
      {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: { votesFor: 1 },
        filter: { typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"] },
        destination: "battlefield",
        leftover: "stay",
      },
    ],
  },
});
