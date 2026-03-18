/**
 * Photos service: Manage photo attachments, caching, storage
 */

import * as FileSystem from 'expo-file-system';
import type { VFPhoto } from '../state/store';
import { uid } from '../state/store';

const PHOTOS_FOLDER = `${FileSystem.documentDirectory}vf_photos/`;

/**
 * Ensure the photos folder exists
 */
export async function ensurePhotosFolder(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(PHOTOS_FOLDER);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(PHOTOS_FOLDER, { intermediates: true });
    }
  } catch (error) {
    console.warn('Failed to ensure photos folder:', error);
  }
}

/**
 * Save a photo from URI (camera or library) to local storage
 */
export async function savePhotoLocally(
  sourceUri: string,
  source: 'camera' | 'library',
): Promise<VFPhoto | null> {
  try {
    await ensurePhotosFolder();

    const photoId = uid();
    const filename = `${photoId}.jpg`;
    const destinationUri = `${PHOTOS_FOLDER}${filename}`;

    // Copy file from source to local storage
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });

    return {
      id: photoId,
      uri: destinationUri,
      addedAt: new Date().toISOString(),
      source,
    };
  } catch (error) {
    console.warn('Failed to save photo locally:', error);
    return null;
  }
}

/**
 * Delete a photo from local storage
 */
export async function deletePhotoLocally(photo: VFPhoto): Promise<boolean> {
  try {
    await FileSystem.deleteAsync(photo.uri);
    return true;
  } catch (error) {
    console.warn('Failed to delete photo:', error);
    return false;
  }
}

/**
 * Get storage usage for photos
 */
export async function getPhotoStorageUsage(): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(PHOTOS_FOLDER);
    if (!info.exists) return 0;

    const files = await FileSystem.readDirectoryAsync(PHOTOS_FOLDER);
    let totalSize = 0;

    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${PHOTOS_FOLDER}${file}`);
      if (fileInfo.exists && fileInfo.size) {
        totalSize += fileInfo.size;
      }
    }

    return totalSize;
  } catch (error) {
    console.warn('Failed to get photo storage usage:', error);
    return 0;
  }
}

/**
 * Clear all cached photos
 */
export async function clearPhotoCache(): Promise<void> {
  try {
    await FileSystem.deleteAsync(PHOTOS_FOLDER);
    await ensurePhotosFolder();
  } catch (error) {
    console.warn('Failed to clear photo cache:', error);
  }
}
