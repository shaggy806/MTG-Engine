import { defineCard } from "../define.js";

// "If you haven't cast a spell this turn" is asked as the ability resolves,
// counting spells cast before Conduit arrived too (the ruling). The card is
// cast for its costs, as the ability resolves (rule 608.2g); casting it bars
// any other spell for the rest of the turn.
const LANDS_TEXT = "You may play lands from your graveyard.";
const CAST_TEXT =
  "{T}: Choose target nonland permanent card in your graveyard. If you haven't cast a spell this turn, you may cast that card. If you do, you can't cast additional spells this turn. Activate only as a sorcery.";

export default defineCard({
  name: "Conduit of Worlds",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["artifact"],
  text: `${LANDS_TEXT}\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      playFromGraveyard: { type: "land" },
      text: LANDS_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      sorcerySpeed: true,
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: {
            typesAnyOf: ["artifact", "battle", "creature", "enchantment", "planeswalker"],
            notTypes: ["land"],
          },
        },
      ],
      effect: {
        kind: "conditional",
        condition: { kind: "cast-this-turn", atLeast: 0, atMost: 0 },
        then: { kind: "cast-now", target: 0, then: { kind: "prohibit", who: "you", spells: true } },
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
