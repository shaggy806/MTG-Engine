import { defineCard } from "../define.js";

const SWARM_TEXT =
  "Whenever you sacrifice a land, create a tapped token that's a copy of this creature if seven or more land cards are in your graveyard. Otherwise, create a tapped 1/1 black Insect creature token with flying.";

// The land cards are counted as the trigger resolves, usually including the
// one just sacrificed (the ruling). A copy of this creature after it has left
// is a copy of it as it last existed (rule 608.2h).
export default defineCard({
  name: "Scouring Swarm",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${SWARM_TEXT}`,
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "cards-in-graveyard", atLeast: 7, filter: { type: "land" } },
        then: { kind: "create-token-copy", of: "source", count: 1, tapped: true },
        else: { kind: "create-token", token: "Insect Token (Black, Flying)", count: 1, tapped: true },
      },
      resolve: null,
      text: SWARM_TEXT,
    },
  ],
});
