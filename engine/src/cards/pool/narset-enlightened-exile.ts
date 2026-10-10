import type { TriggeredAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

// Top-500 commander #238. The copy may be an artifact or enchantment card's:
// a copy of a permanent spell becomes a token as it resolves (rule 608.3f),
// and one not cast ceases to exist (704.5e).
const prowess: TriggeredAbility = {
  trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
  targets: [],
  effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
  resolve: null,
  text: "Prowess (Whenever you cast a noncreature spell, this creature gets +1/+1 until end of turn.)",
};

const ATTACK =
  "Whenever Narset attacks, exile target noncreature, nonland card with mana value less than Narset's power from a graveyard and copy it. You may cast the copy without paying its mana cost.";

export default defineCard({
  name: "Narset, Enlightened Exile",
  manaCost: "{1}{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Monk"],
  power: 3,
  toughness: 4,
  text: `Creatures you control have prowess.\n${ATTACK}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantsTriggered: [prowess],
      text: "Creatures you control have prowess.",
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "any",
          filter: { notTypes: ["creature", "land"], manaValue: { op: "lt", n: { amount: { powerOf: "source" } } } },
        },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile", target: 0 },
          { kind: "cast-now", from: "exiled-this-way", copies: 1, free: true },
        ],
      },
      resolve: null,
      text: ATTACK,
    },
  ],
});
