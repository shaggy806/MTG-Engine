import { defineCard } from "../define.js";

// #42 in top-commanders.txt.
//
// "Dog" and "Cat" are matched as plain subtypes everywhere below. That is
// exact only because nothing in the pool or tokens has changeling (rule
// 702.73a) or is otherwise every creature type; a card that does would need
// to count as both a Dog and a Cat for all four clauses.
const DOG_TEXT = "Whenever you cast a Dog spell, create a 1/1 green Cat creature token.";
const CAT_TEXT = "Whenever you cast a Cat spell, create a 1/1 white Dog creature token.";
const PING_TEXT =
  "{R}{G}{W}, {T}: Rin and Seri deals damage to any target equal to the number of Dogs " +
  "you control. You gain life equal to the number of Cats you control.";

export default defineCard({
  name: "Rin and Seri, Inseparable",
  manaCost: "{1}{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dog", "Cat"],
  power: 4,
  toughness: 4,
  text: `${DOG_TEXT}\n${CAT_TEXT}\n${PING_TEXT}`,
  triggered: [
    {
      // `otherOnly` restores rule 113.6 rather than adding a word: these
      // abilities work only from the battlefield, so Rin and Seri being cast
      // never triggers them (the 2020-06-23 ruling says so outright). But the
      // spell a `spell-cast` event is about joins the trigger scan with all
      // its abilities — Rin and Seri is a Dog spell *and* a Cat spell — so
      // without it the card would make a Cat and a Dog off its own cast. A
      // Rin and Seri already on the battlefield is never the spell being
      // cast, so excluding the source loses nothing the card does.
      trigger: { on: "cast-spell", who: "you", otherOnly: true, filter: { subtype: "Dog" } },
      targets: [],
      effect: { kind: "create-token", token: "1/1 Green Cat Token", count: 1 },
      resolve: null,
      text: DOG_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", otherOnly: true, filter: { subtype: "Cat" } },
      targets: [],
      effect: { kind: "create-token", token: "1/1 White Dog Token", count: 1 },
      resolve: null,
      text: CAT_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{R}{G}{W}", tap: true },
      targets: ["any-target"],
      // Both counts are read as the ability resolves (ruling 2020-06-23), off
      // the battlefield only, so Rin and Seri counts itself — it's a Dog and a
      // Cat — while it's still there. A token stack counts as every token in
      // it. The damage comes first, but state-based actions don't run until
      // the whole ability has resolved, so a Cat the damage kills is still
      // counted for the life. An illegal target fizzles the whole ability,
      // life gain included (the same ruling).
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "damage",
            amount: { countOf: { subtype: "Dog", controlledBy: "you" } },
            target: 0,
          },
          {
            kind: "gain-life",
            amount: { countOf: { subtype: "Cat", controlledBy: "you" } },
          },
        ],
      },
      resolve: null,
      text: PING_TEXT,
    },
  ],
});
