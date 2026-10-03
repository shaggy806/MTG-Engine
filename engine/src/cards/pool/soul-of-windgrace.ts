import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// The land is chosen as the ability resolves, from any graveyard (all
// public), and enters under your control whoever owns it (the rulings). One
// that enters attacking was never declared as an attacker, so only its
// enters ability triggers that combat (the ruling). Its last ability may be
// activated while it's tapped (the ruling): "tap it" then does nothing.
const RETURN_TEXT =
  "Whenever Soul of Windgrace enters or attacks, you may put a land card from a graveyard onto the battlefield tapped under your control.";
const LIFE_TEXT = "{G}, Discard a land card: You gain 3 life.";
const DRAW_TEXT = "{1}{R}, Discard a land card: Draw a card.";
const GUARD_TEXT = "{2}{B}, Discard a land card: Soul of Windgrace gains indestructible until end of turn. Tap it.";

const returnLand: EffectSpec = {
  kind: "look-and-choose",
  zone: "graveyards",
  min: 0,
  max: 1,
  destination: "battlefield",
  enterTapped: true,
  leftover: "stay",
  filter: { type: "land" },
};

const discardLand = { count: 1, filter: { type: "land" } } as const;

export default defineCard({
  name: "Soul of Windgrace",
  manaCost: "{1}{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cat", "Avatar"],
  power: 5,
  toughness: 4,
  text: `${RETURN_TEXT}\n${LIFE_TEXT}\n${DRAW_TEXT}\n${GUARD_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: returnLand,
      resolve: null,
      text: RETURN_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: returnLand,
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{G}", tap: false, discard: discardLand },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: LIFE_TEXT,
    },
    {
      cost: { mana: "{1}{R}", tap: false, discard: discardLand },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
    {
      cost: { mana: "{2}{B}", tap: false, discard: discardLand },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: "source", keyword: "indestructible", duration: "end-of-turn" },
          { kind: "tap", target: "source" },
        ],
      },
      resolve: null,
      text: GUARD_TEXT,
    },
  ],
});
