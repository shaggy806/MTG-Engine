import { defineCard } from "../define.js";

// X is the sacrificed creature's power as it last existed on the
// battlefield, not in the graveyard (rule 608.2h — the card's ruling).
// "Whenever you gain life" triggers once per life-gain event (rule 119.9).
export default defineCard({
  name: "Dina, Soul Steeper",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dryad", "Druid"],
  power: 1,
  toughness: 3,
  text:
    "Whenever you gain life, each opponent loses 1 life.\n" +
    "{1}, Sacrifice another creature: Dina gets +X/+0 until end of turn, where X is the " +
    "sacrificed creature's power.",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever you gain life, each opponent loses 1 life.",
    },
  ],
  activated: [
    {
      // `otherOnly` keeps Dina out of her own sacrifice cost ("another").
      cost: {
        mana: "{1}",
        tap: false,
        sacrifice: { filter: { type: "creature", controlledBy: "you" } },
      },
      otherOnly: true,
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: { powerOf: "sacrificed" },
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text:
        "{1}, Sacrifice another creature: Dina gets +X/+0 until end of turn, where X is the " +
        "sacrificed creature's power.",
    },
  ],
});
