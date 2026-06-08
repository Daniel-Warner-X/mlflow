import { useDesignSystemTheme } from '@databricks/design-system';
import { useState } from 'react';
import type { ParsedServerJson, ServerIcon } from '../types';
import { getServerIconSrc } from '../utils/serverIconUtils';

// Approximates theme blue500 for raster/data-uri SVG icons via CSS filter.
const DATA_URI_ICON_FILTER =
  'brightness(0) saturate(100%) invert(36%) sepia(93%) saturate(1415%) hue-rotate(194deg) brightness(96%) contrast(101%)';

/**
 * Server Path Icon - represents MCP servers/connections
 */
const ServerPathIcon = ({ size, color }: { size: number; color: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    css={{ flexShrink: 0, display: 'block' }}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.25 5C1.25 2.92893 2.92893 1.25 5 1.25H19C21.0711 1.25 22.75 2.92893 22.75 5C22.75 6.2267 22.161 7.31583 21.2504 8C22.161 8.68417 22.75 9.7733 22.75 11C22.75 13.0711 21.0711 14.75 19 14.75H12.75V16.3535C13.6658 16.6125 14.3875 17.3342 14.6465 18.25H22C22.4142 18.25 22.75 18.5858 22.75 19C22.75 19.4142 22.4142 19.75 22 19.75H14.6465C14.32 20.9043 13.2588 21.75 12 21.75C10.7412 21.75 9.67998 20.9043 9.35352 19.75H2C1.58579 19.75 1.25 19.4142 1.25 19C1.25 18.5858 1.58579 18.25 2 18.25H9.35352C9.61255 17.3342 10.3342 16.6125 11.25 16.3535V14.75H5C2.92893 14.75 1.25 13.0711 1.25 11C1.25 9.7733 1.83901 8.68417 2.74963 8C1.83901 7.31583 1.25 6.2267 1.25 5ZM5 7.25C3.75736 7.25 2.75 6.24264 2.75 5C2.75 3.75736 3.75736 2.75 5 2.75H19C20.2426 2.75 21.25 3.75736 21.25 5C21.25 6.24264 20.2426 7.25 19 7.25H5ZM19 8.75H5C3.75736 8.75 2.75 9.75736 2.75 11C2.75 12.2426 3.75736 13.25 5 13.25H19C20.2426 13.25 21.25 12.2426 21.25 11C21.25 9.75736 20.2426 8.75 19 8.75ZM12.25 5C12.25 4.58579 12.5858 4.25 13 4.25H19C19.4142 4.25 19.75 4.58579 19.75 5C19.75 5.41421 19.4142 5.75 19 5.75H13C12.5858 5.75 12.25 5.41421 12.25 5ZM12.25 11C12.25 10.5858 12.5858 10.25 13 10.25H19C19.4142 10.25 19.75 10.5858 19.75 11C19.75 11.4142 19.4142 11.75 19 11.75H13C12.5858 11.75 12.25 11.4142 12.25 11ZM12 17.75C11.3096 17.75 10.75 18.3096 10.75 19C10.75 19.6904 11.3096 20.25 12 20.25C12.6904 20.25 13.25 19.6904 13.25 19C13.25 18.3096 12.6904 17.75 12 17.75Z"
      fill={color}
    />
    <path
      d="M7 5C7 5.55228 6.55228 6 6 6C5.44772 6 5 5.55228 5 5C5 4.44772 5.44772 4 6 4C6.55228 4 7 4.44772 7 5Z"
      fill={color}
    />
    <path
      d="M7 11C7 11.5523 6.55228 12 6 12C5.44772 12 5 11.5523 5 11C5 10.4477 5.44772 10 6 10C6.55228 10 7 10.4477 7 11Z"
      fill={color}
    />
  </svg>
);

const toRenderableIconSrc = (src: string): string => {
  if (!src.startsWith('data:image/svg+xml,')) {
    return src;
  }

  try {
    const payload = src.slice(src.indexOf(',') + 1);
    const svgMarkup = decodeURIComponent(payload);
    return `data:image/svg+xml;base64,${btoa(svgMarkup)}`;
  } catch {
    return src;
  }
};

const CustomServerIcon = ({ src, size, color }: { src: string; size: number; color: string }) => {
  const [failed, setFailed] = useState(false);
  const renderableSrc = toRenderableIconSrc(src);

  if (failed) {
    return <ServerPathIcon size={size} color={color} />;
  }

  return (
    <img
      src={renderableSrc}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      css={{
        display: 'block',
        flexShrink: 0,
        objectFit: 'contain',
        filter: src.startsWith('data:image/svg+xml') ? DATA_URI_ICON_FILTER : undefined,
      }}
    />
  );
};

/**
 * Displays the icon for an MCP server, using the first icon from the server.json
 * or falling back to a default server path icon if none is provided.
 */
export const ToolIcon = ({
  icons,
  parsedServerJson,
  serverJson,
  size = 24,
  color,
}: {
  icons?: ServerIcon[];
  parsedServerJson?: ParsedServerJson;
  serverJson?: string;
  size?: number;
  color?: string;
}) => {
  const { theme } = useDesignSystemTheme();
  const iconColor = color ?? theme.colors.blue500;
  const iconSrc = getServerIconSrc(icons, parsedServerJson, serverJson);

  if (iconSrc) {
    return <CustomServerIcon src={iconSrc} size={size} color={iconColor} />;
  }

  return <ServerPathIcon size={size} color={iconColor} />;
};
