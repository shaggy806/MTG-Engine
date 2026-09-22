import { defineCard } from "../define.js";

/**
 * Top-commanders rank 281.
 *
 * "Landfall" is an ability word (rule 207.2c) — it does nothing on its own, so
 * it lives in `text` rather than `keywords`, exactly as on Aesi, Tyrant of Gyre
 * Strait and Lotus Cobra.
 *
 * `who: "you-control"` is the whole "a land **you control** enters" clause: it
 * compares the entering permanent's controller against Tatyova's, so a land
 * arriving on an opponent's turn (a Mystic Sanctuary flashed back, a fetch
 * cracked in response) still triggers, while an opponent's own land drop never
 * does. `who: "you"` would be the wrong test — that one asks whose *turn* it is.
 *
 * Landfall is a zone-change trigger, so it fires however the land got there —
 * played, or put onto the battlefield by a spell or ability — but not on a
 * permanent already on the battlefield *becoming* a land (rule 603.2 and the
 * 2024-11-08 landfall rulings).
 *
 * The life gain and the draw are one non-optional instruction in printed order
 * ("you gain 1 life and draw a card"), which is a `sequence`, not a `may`.
 */
export default defineCard({
  name: "Tatyova, Benthic Druid",
  manaCost: "{3}{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Druid"],
  power: 3,
  toughness: 3,
  text: "Landfall — Whenever a land you control enters, you gain 1 life and draw a card.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "land" },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, you gain 1 life and draw a card.",
    },
  ],
});
