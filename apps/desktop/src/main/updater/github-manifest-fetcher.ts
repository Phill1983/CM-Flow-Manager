import {
  validateVersionManifest,
  type ManifestFetcherPort,
  type UpdateChannel,
  type VersionManifest,
} from '@cm-flow-manager/app-updater';

const OWNER = 'Phill1983';
const REPO = 'CM-Flow-Manager';

/**
 * Fetches version-manifest.json from the latest GitHub Release / prerelease for the channel.
 * Failures return null (caller must keep the app fully usable offline).
 */
export class GithubManifestFetcher implements ManifestFetcherPort {
  async fetch(channel: string): Promise<VersionManifest | null> {
    try {
      const releasesUrl = `https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=20`;
      const response = await fetch(releasesUrl, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'CM-Flow-Manager-Updater',
        },
      });
      if (!response.ok) {
        return null;
      }
      const releases = (await response.json()) as Array<{
        prerelease: boolean;
        draft: boolean;
        tag_name: string;
        assets: Array<{ name: string; browser_download_url: string }>;
      }>;

      const candidate = releases.find((release) => {
        if (release.draft) return false;
        if (channel === 'stable') return !release.prerelease;
        // Alpha/beta/development: prefer any non-draft release that has a manifest asset.
        return true;
      });

      if (!candidate) {
        return null;
      }

      const asset = candidate.assets.find((item) => item.name === 'version-manifest.json');
      if (!asset) {
        return null;
      }

      const manifestResponse = await fetch(asset.browser_download_url, {
        headers: { 'User-Agent': 'CM-Flow-Manager-Updater' },
      });
      if (!manifestResponse.ok) {
        return null;
      }
      const json: unknown = await manifestResponse.json();
      const validated = validateVersionManifest(json);
      if (!validated.ok) {
        console.warn('[updater] invalid manifest', validated.errors.join('; '));
        return null;
      }
      if (validated.manifest.channel !== (channel as UpdateChannel) && channel !== 'development') {
        // Allow reading alpha manifest while on alpha even if tagging differs slightly
        if (!(channel === 'alpha' && validated.manifest.channel === 'alpha')) {
          console.warn('[updater] manifest channel mismatch', validated.manifest.channel, channel);
        }
      }
      return validated.manifest;
    } catch (error) {
      console.warn('[updater] manifest fetch failed', error instanceof Error ? error.message : 'unknown');
      return null;
    }
  }
}
