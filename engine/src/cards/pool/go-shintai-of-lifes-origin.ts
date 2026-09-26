import { defineCard } from "../define.js";

// #70 in top-commanders.txt.
//
// "Go-Shintai or another nontoken Shrine you control enters" is two triggers:
// its own entry, token or not — a token copy of it triggers itself (the
// ruling) — and another Shrine's, only a nontoken one. An Aura it returns
// chooses what it enchants as it enters (rule 303.4f).
const RETURN_TEXT = "{W}{U}{B}{R}{G}, {T}: Return target enchantment card from your graveyard to the battlefield.";
const SHRINE_TEXT =
  "Whenever Go-Shintai of Life's Origin or another nontoken Shrine you control enters, create a 1/1 colorless " +
  "Shrine enchantment creature token.";

export default defineCard({
  name: "Go-Shintai of Life's Origin",
  manaCost: "{3}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Shrine"],
  power: 3,
  toughness: 4,
  text: `${RETURN_TEXT}\n${SHRINE_TEXT}`,
  activated: [
    {
      cost: { mana: "{W}{U}{B}{R}{G}", tap: true },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "enchantment" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Shrine Token", count: 1 },
      resolve: null,
      text: SHRINE_TEXT,
    },
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { subtype: "Shrine", token: false },
      },
      targets: [],
      effect: { kind: "create-token", token: "Shrine Token", count: 1 },
      resolve: null,
      text: SHRINE_TEXT,
    },
  ],
});
