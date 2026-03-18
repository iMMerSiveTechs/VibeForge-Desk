import * as ImagePicker from 'expo-image-picker';

export interface PickerAsset {
  uri: string;
  width: number;
  height: number;
}

/**
 * V1: Launch the native image picker (camera or library).
 * No OCR, no network calls. Photo-only intake.
 * TODO V2: Add OCR enrichment as an optional post-step.
 */
export async function launchPicker(
  source: 'camera' | 'library',
): Promise<{ asset: PickerAsset | null; error?: string }> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      return { asset: null, error: 'Camera permission is required to scan.' };
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true });
    if (result.canceled || !result.assets?.[0]) return { asset: null, error: 'Cancelled' };
    return { asset: result.assets[0] };
  } else {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets?.[0]) return { asset: null, error: 'Cancelled' };
    return { asset: result.assets[0] };
  }
}
