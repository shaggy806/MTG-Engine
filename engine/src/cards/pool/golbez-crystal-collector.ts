import { defineCard } from "../define.js";

/**
 * Final Fantasy (FIN). Both triggers are existing vocabulary apart from the
 * graveyard half of `return-to-hand` (`from: "graveyard"`), which is what
 * makes the end-step return *targeted*, as printed, rather than a choice made
 * on resolution.
 *
 * - "Four or more artifacts" is an intervening-if (rule 603.4): checked when
 *   the end step begins and again as the ability resolves. Any artifacts
 *   count, creature or not, and a token stack counts every token in it.
 * - "Then if you control eight or more artifacts" is a fresh check at that
 *   point of the resolution, not part of the intervening-if, so it's a
 *   `conditional` inside the effect.
 * - "That card's power" is the returned card's power in your hand. The
 *   ability's only target is that card, so if it has left the graveyard by
 *   then the whole ability does nothing (rule 608.2b) — no life is lost.
 */
export default defineCard({
  name: "Golbez, Crystal Collector",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 4,
  text:
    "Whenever an artifact you control enters, surveil 1.\n" +
    "At the beginning of your end step, if you control four or more artifacts, return target " +
    "creature card from your graveyard to your hand. Then if you control eight or more " +
    "artifacts, each opponent loses life equal to that card's power.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "Whenever an artifact you control enters, surveil 1.",
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      condition: { kind: "controls", filter: { type: "artifact" }, atLeast: 4 },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "return-to-hand", target: 0, from: "graveyard" },
          {
            kind: "conditional",
            condition: { kind: "controls", filter: { type: "artifact" }, atLeast: 8 },
            then: { kind: "lose-life", amount: { powerOf: 0 }, who: "each-opponent" },
          },
        ],
      },
      resolve: null,
      text:
        "At the beginning of your end step, if you control four or more artifacts, return " +
        "target creature card from your graveyard to your hand. Then if you control eight or " +
        "more artifacts, each opponent loses life equal to that card's power.",
    },
  ],
});
