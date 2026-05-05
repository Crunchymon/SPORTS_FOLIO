import { StrategyType } from "@prisma/client";
import { IStrategy } from "./IStrategy";
import { MomentumStrategy } from "./MomentumStrategy";
import { MeanReversionStrategy } from "./MeanReversionStrategy";
import { NoiseStrategy } from "./NoiseStrategy";

/**
 * Factory Pattern — BotFactory
 *
 * Creates the correct IStrategy implementation for a given StrategyType.
 * The config JSON stored on the Bot model is passed through so each concrete
 * strategy can read its own parameters.
 *
 * Open/Closed: adding a new strategy type means (1) adding a new IStrategy
 * class and (2) adding one case here. BotService, BotRunner, and all existing
 * strategies are never modified.
 *
 * Dependency: BotService depends on BotFactory (concrete → concrete), which is
 * acceptable because factories exist precisely to centralise construction.
 * The callers depend on IStrategy (abstraction) once the object is created.
 */
export class BotFactory {
  public static create(strategyType: StrategyType, config: Record<string, unknown>): IStrategy {
    switch (strategyType) {
      case StrategyType.MOMENTUM:
        return new MomentumStrategy({
          lookback: config.lookback as number | undefined,
          consecutiveThreshold: config.consecutiveThreshold as number | undefined,
          tradeSize: config.tradeSize as number | undefined
        });

      case StrategyType.MEAN_REVERSION:
        return new MeanReversionStrategy({
          windowSize: config.windowSize as number | undefined,
          deviationThreshold: config.deviationThreshold as number | undefined,
          tradeSize: config.tradeSize as number | undefined
        });

      case StrategyType.NOISE:
        return new NoiseStrategy({
          activityRate: config.activityRate as number | undefined,
          minAmount: config.minAmount as number | undefined,
          maxAmount: config.maxAmount as number | undefined
        });

      case StrategyType.USER:
        // USER bots use Momentum as the underlying engine but with
        // user-supplied parameters — the distinction is ownership, not logic.
        return new MomentumStrategy({
          lookback: config.lookback as number | undefined,
          consecutiveThreshold: config.consecutiveThreshold as number | undefined,
          tradeSize: config.tradeSize as number | undefined
        });

      default: {
        // TypeScript exhaustiveness check — the compiler will error here if a
        // new StrategyType is added to the enum without updating this factory.
        const _exhaustive: never = strategyType;
        throw new Error(`Unknown strategy type: ${_exhaustive}`);
      }
    }
  }
}
