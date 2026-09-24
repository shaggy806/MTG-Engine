import { defineCard } from "../define.js";

/**
 * "If it would leave the battlefield, exile it instead of putting it anywhere
 * else" is a replacement that follows the reanimated creature itself
 * (`put-onto-battlefield { exileIfItWouldLeave }`), so a bounce or a death
 * before the end step exiles it too. The end-step exile, which is what
 * actually makes the ability temporary, is a delayed triggered ability (rule
 * 603.7). "It gains haste" has no duration, so it lasts as long as the
 * creature does.
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
    "It gains haste. Exile it at the beginning of the next end step. " +
    "If it would leave the battlefield, exile it instead of putting it anywhere else. " +
    "Activate only as a sorcery.",
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
          {
            kind: "put-onto-battlefield",
            target: 0,
            underYourControl: true,
            exileIfItWouldLeave: true,
          },
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "permanent" },
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
        "It gains haste. Exile it at the beginning of the next end step. " +
        "If it would leave the battlefield, exile it instead of putting it anywhere else. " +
        "Activate only as a sorcery.",
    },
  ],
});
