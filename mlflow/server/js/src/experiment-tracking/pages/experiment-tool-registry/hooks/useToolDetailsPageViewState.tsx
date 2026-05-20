import { useCallback, useReducer } from 'react';
import { first } from 'lodash';
import type { RegisteredToolDetailsResponse } from '../types';

export enum ToolVersionsTableMode {
  PREVIEW = 'preview',
  COMPARE = 'compare',
}

const toolDetailsViewStateReducer = (
  state: {
    mode: ToolVersionsTableMode;
    comparedVersion?: string;
  },
  action:
    | { type: 'setPreviewMode' }
    | { type: 'setCompareMode'; comparedVersion?: string }
    | { type: 'setComparedVersion'; comparedVersion?: string },
) => {
  if (action.type === 'setPreviewMode') {
    return { ...state, mode: ToolVersionsTableMode.PREVIEW };
  }
  if (action.type === 'setCompareMode') {
    return {
      ...state,
      mode: ToolVersionsTableMode.COMPARE,
      comparedVersion: action.comparedVersion,
    };
  }
  if (action.type === 'setComparedVersion') {
    return { ...state, comparedVersion: action.comparedVersion };
  }
  return state;
};

export const useToolDetailsPageViewState = (
  toolDetailsData?: RegisteredToolDetailsResponse,
  selectedVersion?: string,
  setSelectedVersion?: (version: string) => void,
) => {
  const [viewState, dispatchViewMode] = useReducer(toolDetailsViewStateReducer, {
    mode: ToolVersionsTableMode.PREVIEW,
  });

  const setPreviewMode = useCallback(
    (versionEntity?: { version: string }) => {
      const firstVersion = (versionEntity ?? first(toolDetailsData?.versions))?.version;
      if (firstVersion) {
        setSelectedVersion?.(firstVersion);
      }
      dispatchViewMode({ type: 'setPreviewMode' });
    },
    [toolDetailsData, setSelectedVersion],
  );

  const setComparedVersion = useCallback((comparedVersion: string) => {
    dispatchViewMode({ type: 'setComparedVersion', comparedVersion });
  }, []);

  const setCompareMode = useCallback(() => {
    const latestVersion = first(toolDetailsData?.versions)?.version;
    // Use the currently selected version as baseline (left side), or fall back to second version
    const baselineVersion = selectedVersion ?? toolDetailsData?.versions[1]?.version;
    // If baseline is already the latest, compare with the second version; otherwise compare with latest
    const comparedVersion =
      baselineVersion === latestVersion ? toolDetailsData?.versions[1]?.version : latestVersion;

    if (baselineVersion) {
      setSelectedVersion?.(baselineVersion);
    }
    dispatchViewMode({ type: 'setCompareMode', comparedVersion });
  }, [toolDetailsData, selectedVersion, setSelectedVersion]);

  const switchSides = useCallback(() => {
    if (!selectedVersion || !viewState.comparedVersion) {
      return;
    }

    const comparedVersion = viewState.comparedVersion;
    const tempSelectedVersion = selectedVersion;
    setSelectedVersion?.(comparedVersion);
    setComparedVersion(tempSelectedVersion);
  }, [selectedVersion, setComparedVersion, setSelectedVersion, viewState.comparedVersion]);

  if (first(toolDetailsData?.versions) && viewState.mode === ToolVersionsTableMode.PREVIEW && !selectedVersion) {
    setPreviewMode(first(toolDetailsData?.versions));
  }

  return {
    viewState,
    setPreviewMode,
    setCompareMode,
    switchSides,
    setComparedVersion,
  };
};
