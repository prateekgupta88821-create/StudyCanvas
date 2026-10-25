import { WhiteboardProject, Page, CanvasElement, ImageElement } from '@/types/whiteboard';
import { DriveAssetManifest, DriveAssetManifestItem } from '@/types/drive';

const ASSET_PREFIX = 'asset://';
const MAX_INLINE_ASSET_SIZE = 32 * 1024; // 32 KB threshold for externalization

class AssetStorageService {
  private memoryCache = new Map<string, string>();

  /**
   * Computes a simple deterministic hash for an asset string
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Stores an asset in memory cache and returns its asset URI
   */
  registerAsset(dataUrl: string, mimeType = 'image/png'): string {
    const hash = this.hashString(dataUrl);
    const assetId = `asset_${hash}`;
    this.memoryCache.set(assetId, dataUrl);
    return `${ASSET_PREFIX}${assetId}`;
  }

  /**
   * Retrieves an asset from memory cache by assetId or URI
   */
  getAsset(assetIdOrUri: string): string | null {
    const id = assetIdOrUri.replace(ASSET_PREFIX, '');
    return this.memoryCache.get(id) || null;
  }

  /**
   * Resolves an asset reference. If already a data URL or http link, returns as-is.
   */
  resolveAssetSrc(src: string): string {
    if (!src || !src.startsWith(ASSET_PREFIX)) return src;
    const cached = this.getAsset(src);
    return cached || src;
  }

  /**
   * Extracts large image assets from a project to keep document payloads lightweight.
   * Returns a compact project clone and a DriveAssetManifest.
   */
  extractAssets(project: WhiteboardProject): {
    compactProject: WhiteboardProject;
    manifest: DriveAssetManifest;
  } {
    const manifest: DriveAssetManifest = {};

    const updatedPages: Page[] = project.pages.map(page => {
      let pageModified = false;

      const updatedElements: CanvasElement[] = page.elements.map(el => {
        if (el.type === 'image') {
          const img = el as ImageElement;
          if (img.src && img.src.startsWith('data:') && img.src.length > MAX_INLINE_ASSET_SIZE) {
            pageModified = true;
            const assetUri = this.registerAsset(img.src);
            const assetId = assetUri.replace(ASSET_PREFIX, '');

            manifest[assetId] = {
              id: assetId,
              name: `asset_${el.id}.png`,
              mimeType: img.src.substring(5, img.src.indexOf(';')) || 'image/png',
              size: img.src.length,
              createdAt: Date.now(),
            };

            return {
              ...img,
              src: assetUri,
            };
          }
        }
        return el;
      });

      return pageModified ? { ...page, elements: updatedElements } : page;
    });

    const compactProject: WhiteboardProject = {
      ...project,
      pages: updatedPages,
    };

    return { compactProject, manifest };
  }

  /**
   * Creates a lightweight clone for local emergency recovery snapshots
   * to prevent exceeding the browser's 5MB localStorage quota during rapid drawing.
   */
  createLightweightSnapshot(project: WhiteboardProject): WhiteboardProject {
    const { compactProject } = this.extractAssets(project);
    return compactProject;
  }

  /**
   * Hydrates asset references in a project using the memory cache or manifest
   */
  hydrateProject(project: WhiteboardProject, manifest?: DriveAssetManifest): WhiteboardProject {
    const updatedPages: Page[] = project.pages.map(page => {
      const updatedElements: CanvasElement[] = page.elements.map(el => {
        if (el.type === 'image') {
          const img = el as ImageElement;
          if (img.src && img.src.startsWith(ASSET_PREFIX)) {
            const assetId = img.src.replace(ASSET_PREFIX, '');
            const dataUrl = this.memoryCache.get(assetId) || manifest?.[assetId]?.dataUrl;
            if (dataUrl) {
              return { ...img, src: dataUrl };
            }
          }
        }
        return el;
      });

      return { ...page, elements: updatedElements };
    });

    return { ...project, pages: updatedPages };
  }
}

export const assetStorageService = new AssetStorageService();
