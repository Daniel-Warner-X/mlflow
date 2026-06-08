import type { ParsedServerJson, ServerIcon } from '../types';

export const getServerIconSrc = (
  icons?: ServerIcon[],
  parsedServerJson?: ParsedServerJson,
  serverJson?: string,
): string | undefined => {
  const overrideSrc = icons?.[0]?.src;
  if (overrideSrc) {
    return overrideSrc;
  }

  const parsedIconSrc = parsedServerJson?.icons?.[0]?.src;
  if (parsedIconSrc) {
    return parsedIconSrc;
  }

  if (!serverJson) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(serverJson);
    const serverData = parsed?.server || parsed;
    return serverData?.icons?.[0]?.src;
  } catch {
    return undefined;
  }
};

export const buildParsedServerJsonIcons = (
  serverJson?: string,
): ParsedServerJson['icons'] | undefined => {
  if (!serverJson) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(serverJson);
    const serverData = parsed?.server || parsed;
    return serverData?.icons?.map((icon: { src?: string; mimeType?: string }) => ({
      src: icon.src,
      mimeType: icon.mimeType,
    }));
  } catch {
    return undefined;
  }
};
