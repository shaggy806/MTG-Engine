import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// #173 in top-commanders.txt.
//
// Playing a card is playing a land or casting a spell (rules 305.1, 601.2),
// so one `plays-card` trigger covers both, its filter asking about the card
// played: a land with two card types (Dryad Arbor, an artifact land) counts
// as much as an artifact creature spell. Each player makes their own Bird,
// goaded for the rest of the game by Rendmaw's controller, so the Bird
// Rendmaw's controller gets has to attack each combat too (rule 701.15b).
const TEXT =
  "When Rendmaw enters and whenever you play a card with two or more card types, each player creates a tapped " +
  "2/2 black Bird creature token with flying. The tokens are goaded for the rest of the game. (They attack each " +
  "combat if able and attack a player other than you if able.)";

const BIRDS: EffectSpec = {
  kind: "create-token",
  token: "2/2 Black Bird Token",
  count: 1,
  who: "each-player",
  tapped: true,
  goadedForGame: true,
};

export default defineCard({
  name: "Rendmaw, Creaking Nest",
  manaCost: "{3}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Scarecrow"],
  power: 5,
  toughness: 5,
  keywords: ["reach", "menace"],
  text: `Reach, menace\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: BIRDS,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "plays-card", who: "you", filter: { cardTypeCount: { op: "gte", n: 2 } } },
      targets: [],
      effect: BIRDS,
      resolve: null,
      text: TEXT,
    },
  ],
});
