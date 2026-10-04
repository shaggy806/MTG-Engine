import { defineCard } from "../define.js";

// EDHREC rank 5865.

const TEXT =
  "Whenever this creature attacks, target legendary creature you control gains deathtouch until end of turn.";

export default defineCard({
  name: "Mirkwood Spider",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spider"],
  power: 1,
  toughness: 1,
  keywords: ["deathtouch"],
  text: `Deathtouch\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "permanent", whose: "you", filter: { type: "creature", supertype: "legendary" } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "deathtouch", duration: "end-of-turn" },
      resolve: null,
      text: TEXT,
    },
  ],
});
