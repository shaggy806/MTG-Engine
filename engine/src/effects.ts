/**
 * The effect layer: a small declarative vocabulary that the engine interprets,
 * plus the `ResolutionContext` API that both declarative effects and imperative
 * `resolve` scripts (the escape hatch) call into.
 *
 * The engine ({@link Game}) supplies the concrete {@link EffectApi} implementation
 * — these functions just describe *what* to do.
 */

import type { ObjectId, PlayerId } from "./primitives.js";
import type { TargetRef } from "./target.js";

/** A declarative effect. Grows as milestones add vocabulary. */
export type EffectSpec = {
  readonly kind: "damage";
  readonly amount: number;
  /** Index into the spell's chosen targets. */
  readonly target: number;
};

/** Primitive mutations an effect can perform. Implemented by the engine. */
export interface EffectApi {
  dealDamage(target: TargetRef, amount: number): void;
  draw(player: PlayerId, count: number): void;
  gainLife(player: PlayerId, amount: number): void;
  loseLife(player: PlayerId, amount: number): void;
}

export interface ResolutionContext extends EffectApi {
  readonly controller: PlayerId;
  readonly source: ObjectId;
  readonly targets: readonly TargetRef[];
}

/** Imperative escape hatch for a card whose behavior the vocab can't express. */
export type SpellResolver = (ctx: ResolutionContext) => void;

export function applyEffectSpec(spec: EffectSpec, ctx: ResolutionContext): void {
  switch (spec.kind) {
    case "damage": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.dealDamage(target, spec.amount);
      return;
    }
    default:
      throw new Error(
        `unhandled effect kind: ${(spec as { kind: string }).kind}`,
      );
  }
}
