// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { WorkspaceInstallManager } from './installManager/WorkspaceInstallManager';
import { PurgeManager } from './PurgeManager';
import { RushConfiguration } from '../api/RushConfiguration';
import { RushGlobalFolder } from '../api/RushGlobalFolder';

import type { BaseInstallManager, IInstallManagerOptions } from './base/BaseInstallManager';

export class InstallManagerFactory {
  public static async getInstallManagerAsync(
    rushConfiguration: RushConfiguration,
    rushGlobalFolder: RushGlobalFolder,
    purgeManager: PurgeManager,
    options: IInstallManagerOptions
  ): Promise<BaseInstallManager> {
    if (
      rushConfiguration.packageManager === 'pnpm' &&
      rushConfiguration.pnpmOptions &&
      rushConfiguration.pnpmOptions.useWorkspaces
    ) {
      return new WorkspaceInstallManager(rushConfiguration, rushGlobalFolder, purgeManager, options);
    }

    const rushInstallManagerModule: typeof import('./installManager/RushInstallManager') = await import(
      './installManager/RushInstallManager'
    );
    return new rushInstallManagerModule.RushInstallManager(
      rushConfiguration,
      rushGlobalFolder,
      purgeManager,
      options
    );
  }
}
