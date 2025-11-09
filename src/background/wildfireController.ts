import { WildfireController } from '../shared/forest/Wildfire';
import { ForestStorage } from '../shared/storage/forestStorage';
import { SessionStorage } from '../shared/storage/sessionStorage';

export class BackgroundWildfireController {
  private static updateInterval: number | null = null;

  static startMonitoring(): void {
    console.log('🔥 Wildfire monitoring started');
    // Update wildfire every 1 second for faster burning
    this.updateInterval = window.setInterval(async () => {
      const session = await SessionStorage.getSessionState();
      if (!session.active) {
        return;
      }

      const forestState = await ForestStorage.getForestState();
      if (forestState.wildfire.active) {
        console.log(`🔥 Updating wildfire - ${forestState.wildfire.affectedTreeIds.length} trees burning`);
        await WildfireController.updateWildfire();
      }
    }, 1000); // Update every second for faster action
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

