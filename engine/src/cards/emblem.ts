/**
 * The definition every emblem object is read through (rule 114): no colours,
 * no types, no abilities of its own — an emblem's triggered abilities ride on
 * its object's modifiers (see `Game.createEmblem`). Registered beside the
 * pool, as the face-down definitions are; not a card a deck can hold.
 */
import { defineCard } from "./define.js";
import type { CardDefinition } from "./define.js";

/** The registry name of an emblem object. */
export const EMBLEM_CARD = "Emblem";

export const EMBLEM_DEFINITIONS: readonly CardDefinition[] = [
  defineCard({
    name: EMBLEM_CARD,
    colors: [],
    types: [],
    text: "",
  }),
];
