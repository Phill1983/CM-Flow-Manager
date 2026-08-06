export type ParsedVersion = {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
};

const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

export function parseVersion(input: string): ParsedVersion | null {
  const trimmed = input.trim();
  const match = VERSION_RE.exec(trimmed);
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  };
}

export function isValidVersionString(input: unknown): input is string {
  return typeof input === 'string' && parseVersion(input) !== null;
}

/** Negative if a < b, 0 if equal, positive if a > b. */
export function compareVersions(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) {
    throw new Error('Invalid version string for comparison');
  }
  if (left.major !== right.major) return left.major - right.major;
  if (left.minor !== right.minor) return left.minor - right.minor;
  if (left.patch !== right.patch) return left.patch - right.patch;

  // No prerelease > any prerelease (SemVer)
  if (left.prerelease === null && right.prerelease === null) return 0;
  if (left.prerelease === null) return 1;
  if (right.prerelease === null) return -1;
  return left.prerelease.localeCompare(right.prerelease, 'en');
}

export function isOlderThan(current: string, other: string): boolean {
  return compareVersions(current, other) < 0;
}
