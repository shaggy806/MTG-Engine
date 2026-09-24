import { defineCard } from "../define.js";

/**
 * Top-commanders rank 178.
 *
 * The tax clause is `commanderTaxAsLife`: a cast from the command zone costs
 * the printed {2}{W}{W}{B} plus 2 life per previous cast from there, where any
 * other commander would pay {2} more mana each time. A cast from anywhere else
 * (Liesa bounced to hand) owes no tax in either currency. The life is part of
 * the total cost, so it can't be paid from a life total below it (rule 119.4)
 * and a cost reduction, which only ever touches generic mana, doesn't reach it.
 *
 * "Whenever a player casts a spell, they lose 2 life" is `who: "any"` — its
 * controller included — read back through `"trigger-controller"` (the
 * spell's controller, i.e. whoever cast it). Not a target, so hexproof
 * doesn't stop it. Liesa's own cast fires nothing: she is a spell on the
 * stack then, where only "when you cast this spell" abilities function (rule
 * 113.6), and `detectTriggers` holds a just-cast spell to exactly those.
 */
const TAX_TEXT =
  "Rather than pay {2} for each previous time you've cast this spell from the command zone " +
  "this game, pay 2 life that many times.";
const DRAIN_TEXT = "Whenever a player casts a spell, they lose 2 life.";

export default defineCard({
  name: "Liesa, Shroud of Dusk",
  manaCost: "{2}{W}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "lifelink"],
  commanderTaxAsLife: true,
  text: "Flying, lifelink\n" + TAX_TEXT + "\n" + DRAIN_TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "any" },
      targets: [],
      effect: { kind: "lose-life", amount: 2, who: "trigger-controller" },
      resolve: null,
      text: DRAIN_TEXT,
    },
  ],
});
