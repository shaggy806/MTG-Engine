import { defineCard } from "../define.js";

/** The trigger watches every creature you control, once per creature: a spell
 * naming two of them triggers it twice, one naming the same creature in two
 * slots triggers it once. Spells only — an activated ability targeting your
 * creature doesn't count, and neither does whose spell it was. "Up to one"
 * lets the fight be declined, since Gargos would otherwise have to fight
 * something that kills it. */
export default defineCard({
  name: "Gargos, Vicious Watcher",
  manaCost: "{3}{G}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Hydra"],
  power: 8,
  toughness: 7,
  keywords: ["vigilance"],
  text:
    "Vigilance\n" +
    "Hydra spells you cast cost {4} less to cast.\n" +
    "Whenever a creature you control becomes the target of a spell, Gargos, Vicious Watcher fights up to one target creature you don't control.",
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { subtype: "Hydra", controlledBy: "you" },
        reduceGeneric: 4,
      },
      text: "Hydra spells you cast cost {4} less to cast.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "becomes-target",
        who: "you-control",
        filter: { type: "creature" },
        spellOnly: true,
      },
      targets: [{ kind: "optional", of: "creature-an-opponent-controls" }],
      effect: { kind: "fight", a: "source", b: 0 },
      resolve: null,
      text:
        "Whenever a creature you control becomes the target of a spell, Gargos, Vicious Watcher fights up to one target creature you don't control.",
    },
  ],
});
