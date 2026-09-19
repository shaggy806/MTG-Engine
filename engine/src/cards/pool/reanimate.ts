import { defineCard } from "../define.js";

/** `manaValueOf` reads the card's *printed* value as last-known information
 * (rule 608.2h), so it still answers correctly having just been moved. */
export default defineCard({
  name: "Reanimate",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Put target creature card from a graveyard onto the battlefield under your control. " +
    "You lose life equal to that card's mana value.",
  targets: [{ kind: "card-in-graveyard", filter: { type: "creature" } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      { kind: "lose-life", amount: { manaValueOf: 0 } },
    ],
  },
});
