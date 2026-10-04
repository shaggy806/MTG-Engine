import { defineCard } from "../define.js";

// EDHREC rank 5641.
//
// Reanimate's shape from any graveyard, narrowed to a legendary permanent
// card (no instant or sorcery) not named Staff of Eden. "Permanents you
// control but don't own" are Agent of Treachery's `ownedBy: "opponent"`
// (anyone else): a token is owned by the player who made it (the ruling), so
// a token an opponent made that you control counts. Counted as the draw
// ability resolves.
//
// Rulings:
//   [2024-07-05] The owner of a token is the player who created that token or, in the case of a
//     resolving copy of a permanent spell that became a token, the player who controlled that
//     spell as it resolved.

const ETB_TEXT =
  "When Staff of Eden enters, put target legendary permanent card not named Staff of Eden, Vault's Key from a graveyard onto the battlefield under your control.";
const DRAW_TEXT = "{T}: Draw a card for each permanent you control but don't own.";

export default defineCard({
  name: "Staff of Eden, Vault's Key",
  manaCost: "{6}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${ETB_TEXT}\n${DRAW_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "draw", amount: { countOf: { controlledBy: "you", ownedBy: "opponent" } } },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          filter: {
            supertype: "legendary",
            notTypes: ["instant", "sorcery"],
            notName: "Staff of Eden, Vault's Key",
          },
        },
      ],
      effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
});
