import { defineCard } from "../define.js";

/**
 * Drops "If it would leave the battlefield, exile it instead of putting it
 * anywhere else" — a per-object replacement that only this card and Necromancy
 * want, and which the reanimated creature would have to carry around.
 * The end-step exile, which is what actually makes the ability temporary, is
 * a delayed triggered ability (rule 603.7).
 */
export default defineCard({
  name: "Whip of Erebos",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["enchantment", "artifact"],
  text:
    "Creatures you control have lifelink.\n" +
    "{2}{B}{B}, {T}: Return target creature card from your graveyard to the battlefield. " +
    "It gains haste. Exile it at the beginning of the next end step. Activate only as a sorcery.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["lifelink"],
      text: "Creatures you control have lifelink.",
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{B}{B}", tap: true },
      sorcerySpeed: true,
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "put-onto-battlefield", target: 0, underYourControl: true },
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
          {
            kind: "delayed-trigger",
            at: "next-end-step",
            // `target: 0` is still the same object — it kept its id across the
            // graveyard-to-battlefield move.
            effect: { kind: "exile", target: 0 },
            text: "Exile the creature Whip of Erebos returned.",
          },
        ],
      },
      resolve: null,
      text:
        "{2}{B}{B}, {T}: Return target creature card from your graveyard to the battlefield. " +
        "It gains haste. Exile it at the beginning of the next end step. Activate only as a sorcery.",
    },
  ],
});
