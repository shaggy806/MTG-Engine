import { defineCard } from "../define.js";

// EDHREC rank 2703.
//
// Rulings:
//   [2008-04-01] Murmuring Bosk is a Forest, but it isn't a basic land. Things that affect basic
//     lands don't affect it. Things that affect basic land types do. For example, you can't find
//     Murmuring Bosk with Fertilid's ability ("searches their library for a basic land card"), but
//     you can find Murmuring Bosk with Everbark Shaman's ability ("search your library for two
//     Forest cards").
//
// The reveal is the reveal lands' replacement; a changeling card in hand is a
// Treefolk card to reveal (rule 702.73a — `Game.revealableFromHand`). The
// painful half is a pain land's, one ability per colour.
const REVEAL_TEXT =
  "As this land enters, you may reveal a Treefolk card from your hand. If you don't, this land enters tapped.";

export default defineCard({
  name: "Murmuring Bosk",
  colors: [],
  types: ["land"],
  subtypes: ["Forest"],
  text: `({T}: Add {G}.)\n${REVEAL_TEXT}\n{T}: Add {W} or {B}. This land deals 1 damage to you.`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tappedUnlessRevealFromHand: ["Treefolk"] },
      text: REVEAL_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
    ...(["W", "B"] as const).map((c) => ({
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana" as const, mana: c, amount: 1, painToController: 1 },
      resolve: null,
      text: `{T}: Add {${c}}. This land deals 1 damage to you.`,
    })),
  ],
});
