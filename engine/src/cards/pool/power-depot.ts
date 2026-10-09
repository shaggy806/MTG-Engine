import { defineCard } from "../define.js";
import { addManaAbility, entersTappedStatic } from "../helpers.js";

// EDHREC rank 1988. Modular 1 (rule 702.43a) on a land — Arcbound Ravager's
// two abilities: it enters with a +1/+1 counter, and when it's put into a
// graveyard from the battlefield its counters (as it last existed) may go on
// an artifact creature.
const RESTRICTED =
  "{T}: Add one mana of any color. Spend this mana only to cast artifact spells or activate abilities of artifacts.";
const MODULAR_TEXT =
  "Modular 1 (This land enters with a +1/+1 counter on it. When it's put into a graveyard, you may put its +1/+1 counters on target artifact creature.)";

export default defineCard({
  name: "Power Depot",
  colors: [],
  types: ["artifact", "land"],
  text: `This land enters tapped.\n{T}: Add {C}.\n${RESTRICTED}\nModular 1`,
  static: [
    { ...entersTappedStatic("Power Depot"), text: "This land enters tapped." },
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: 1 } },
      text: MODULAR_TEXT,
    },
  ],
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: {
          spell: { type: "artifact" },
          abilityOf: { type: "artifact" },
          text: "Spend this mana only to cast artifact spells or activate abilities of artifacts.",
        },
      },
      resolve: null,
      text: RESTRICTED,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [{ kind: "permanent", filter: { types: ["artifact", "creature"] } }],
      effect: {
        kind: "may",
        prompt: "Put this land's +1/+1 counters on target artifact creature?",
        effect: {
          kind: "add-counter",
          target: 0,
          counter: "+1/+1",
          amount: { countersOn: "source", counter: "+1/+1" },
        },
      },
      resolve: null,
      text: MODULAR_TEXT,
    },
  ],
});
