import { defineCard } from "../define.js";

// EDHREC rank 2556.
// Makes Servo → use "Servo Token".
//
// Rulings:
//   [2019-05-03] If an effect begins to apply to the target artifact before it becomes a copy of
//     another permanent, that effect will continue to apply.
//   [2019-05-03] Saheeli's first ability resolves before the spell that caused it to trigger. It
//     resolves even if that spell is countered.
//   [2019-05-03] If the target artifact is an Equipment attached to a creature and it becomes a
//     copy of a non-Equipment permanent, it becomes unattached. If it becomes a copy of an
//     Equipment, it remains attached.
//   [2019-05-03] The target artifact is an artifact in addition to whatever types the second
//     target has, and this exception is copiable. If something else copies the artifact later in
//     the turn, that copy also will be an artifact.
//   [2019-05-03] Saheeli's loyalty ability causes the target artifact to copy the printed values
//     of the target permanent, plus any copy effects that have been applied to it. It won't copy
//     counters on that permanent or effects that have changed its power, toughness, types, color,
//     or so on. Notably, it won't copy effects that made the target permanent become a creature.
//   [2019-05-03] If the target artifact copies a permanent that's copying something else, it will
//     become whatever the target is copying.
//
// The −2 is Sarkhan, Soul Aflame's `become-copy`, between two target slots;
// "an artifact in addition to its other types" is a copy exception
// (`addTypes`), so it's copiable (rule 707.9b). An Equipment left attached to
// a creature as a non-Equipment falls off as a state-based action (704.5p).

const SERVO_TEXT = "Whenever you cast a noncreature spell, create a 1/1 colorless Servo artifact creature token.";
const COPY_TEXT =
  "−2: Target artifact you control becomes a copy of another target artifact or creature you control until end of turn, except it's an artifact in addition to its other types.";

export default defineCard({
  name: "Saheeli, Sublime Artificer",
  manaCost: "{1}{U/R}{U/R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Saheeli"],
  loyalty: 5,
  text: `${SERVO_TEXT}\n${COPY_TEXT}`,
  activated: [
    {
      loyaltyCost: -2,
      cost: { mana: null, tap: false },
      targets: [
        { kind: "permanent", whose: "you", filter: { type: "artifact" } },
        {
          kind: "other",
          of: { kind: "permanent", whose: "you", filter: { typesAnyOf: ["artifact", "creature"] } },
          than: { slots: [0] },
        },
      ],
      effect: { kind: "become-copy", target: 0, of: 1, until: "end-of-turn", exceptions: { addTypes: ["artifact"] } },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "create-token", token: "Servo Token", count: 1 },
      resolve: null,
      text: SERVO_TEXT,
    },
  ],
});
