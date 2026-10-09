import { defineCard } from "../define.js";

// EDHREC rank 2773.
//
// - The counters are Diregraf Colossus's enters replacement (rule 614.1c),
//   counted as the Troll moves: one returned straight from the graveyard to
//   the battlefield counts itself (its ruling).
// - Removing a counter is part of the regeneration's cost, so damage already
//   marked can turn lethal before the shield exists (its ruling).
// - Dredge is `CardDefinition.dredge` (Life from the Loam's).
const ENTER_TEXT =
  "This creature enters with a +1/+1 counter on it for each creature card in your graveyard.";
const REGEN_TEXT = "{1}, Remove a +1/+1 counter from this creature: Regenerate this creature.";

export default defineCard({
  name: "Golgari Grave-Troll",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Troll", "Skeleton"],
  power: 0,
  toughness: 0,
  dredge: 6,
  text:
    `${ENTER_TEXT}\n${REGEN_TEXT}\n` +
    "Dredge 6 (If you would draw a card, you may mill six cards instead. If you do, return this card from your graveyard to your hand.)",
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        counters: { kind: "+1/+1", amount: { countInGraveyard: { type: "creature", ownedBy: "you" } } },
      },
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: false, removeCounter: { kind: "+1/+1", count: 1 } },
      targets: [],
      effect: { kind: "regenerate", target: "source" },
      resolve: null,
      text: REGEN_TEXT,
    },
  ],
});
