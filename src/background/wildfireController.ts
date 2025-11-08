import { WildfireController } from '../shared/forest/Wildfire';
import { ForestStorage } from '../shared/storage/forestStorage';
import { SessionStorage } from '../shared/storage/sessionStorage';

export class BackgroundWildfireController {
  private static updateInterval: number | null = null;

  static startMonitoring(): void {
    // Update wildfire every 2 seconds
    this.updateInterval = window.setInterval(async () => {
      const session = await SessionStorage.getSessionState();
      if (!session.active) {
        return;
      }

      const forestState = await ForestStorage.getForestState();
      if (forestState.wildfire.active) {
        await WildfireController.updateWildfire();
      }
    }, 2000);
  }

  static stopMonitoring(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  static async triggerWildfire(): Promise<void> {
    await WildfireController.startWildfire();
  }

  static async stopWildfire(): Promise<void> {
    await WildfireController.stopWildfire();
  }

  static async recoverTrees(): Promise<void> {
    await WildfireController.recoverTrees();
  }
}

