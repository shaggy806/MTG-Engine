import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

const SAC_TEXT = "When Uro enters, sacrifice it unless it escaped.";
const VALUE_TEXT =
  "Whenever Uro enters or attacks, you gain 3 life and draw a card, then you may put a land card from your hand onto the battlefield.";

const VALUE: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "gain-life", amount: 3 },
    { kind: "draw", amount: 1 },
    {
      kind: "look-and-choose",
      zone: "hand",
      min: 0,
      max: 1,
      destination: "battlefield",
      leftover: "stay",
      filter: { type: "land" },
    },
  ],
};

// "Unless it escaped" asks how this object was cast: from a graveyard under
// any other permission (or not cast at all) it's sacrificed (its ruling).
// The land isn't played, so it takes no land drop and works on any turn.
export default defineCard({
  name: "Uro, Titan of Nature's Wrath",
  manaCost: "{1}{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Giant"],
  power: 6,
  toughness: 6,
  text:
    `${SAC_TEXT}\n${VALUE_TEXT}\n` +
    "Escape—{G}{G}{U}{U}, Exile five other cards from your graveyard. (You may cast this card from your graveyard for its escape cost.)",
  escape: { cost: "{G}{G}{U}{U}", exileCount: 5 },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "not", of: { kind: "source", filter: { castVia: "escape" } } },
        then: { kind: "sacrifice-source" },
      },
      resolve: null,
      text: SAC_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: VALUE,
      resolve: null,
      text: VALUE_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: VALUE,
      resolve: null,
      text: VALUE_TEXT,
    },
  ],
});
