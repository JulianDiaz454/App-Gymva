// expo-file-system v19 movió las funciones síncronas a /legacy.
// Mantenemos la API legacy aquí porque es la que casa con el uso
// (documentDirectory + copyAsync). La nueva API basada en File/Directory
// es más limpia pero requiere refactor mayor.
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';

import { PlusIcon, TrashIcon } from '@/components/AppIcons';
import { BackBar } from '@/components/BackBar';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { addPhoto, deletePhoto, listPhotos } from '@/db/queries/measurements';
import type { ProgressPhoto } from '@/db/schema';
import { colors, radii, space } from '@/theme/tokens';
import { formatShortDate, todayIso } from '@/utils/date';

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;

async function ensurePhotosDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

export default function PhotosScreen() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);

  const load = useCallback(async () => {
    setPhotos(await listPhotos());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0]!;
    await ensurePhotosDir();
    const fileName = `photo-${Date.now()}.jpg`;
    const dest = `${PHOTOS_DIR}${fileName}`;
    await FileSystem.copyAsync({ from: asset.uri, to: dest });
    // Solo persistimos la ruta en BD (ESPECIFICACION §3.9)
    await addPhoto({ filePath: dest, date: todayIso() });
    await load();
  };

  const onDelete = async (p: ProgressPhoto) => {
    try {
      await FileSystem.deleteAsync(p.filePath, { idempotent: true });
    } catch {
      // archivo ya no existe — sigue
    }
    await deletePhoto(p.id);
    await load();
  };

  return (
    <Screen scroll={false}>
      <BackBar />
      <Header
        eyebrow="Galería"
        title="Fotos de progreso"
        style={{ paddingTop: 8 }}
        right={
          <IconButton variant="primary" size={44} onPress={onPick}>
            <PlusIcon size={20} color={colors.bg} />
          </IconButton>
        }
      />
      {photos.length === 0 ? (
        <EmptyState
          emoji="📷"
          title="Sin fotos todavía"
          message="Añade fotos del antes/después para acompañar tus medidas."
        />
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(p) => String(p.id)}
          numColumns={2}
          contentContainerStyle={{ padding: space.xl, gap: 12, paddingBottom: 120 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <View style={styles.photoCard}>
              <Image source={{ uri: item.filePath }} style={styles.image} />
              <View style={styles.photoFooter}>
                <Text variant="micro" tone="muted">{formatShortDate(item.date)}</Text>
                <Pressable onPress={() => onDelete(item)} hitSlop={8}>
                  <TrashIcon size={14} color={colors.textMut} />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 0.75,
    backgroundColor: colors.raised,
  },
  photoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
});
