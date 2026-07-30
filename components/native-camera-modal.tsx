import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import type { NativeCameraResult } from '@/lib/native-bridge';

interface NativeCameraModalProps {
  visible: boolean;
  requestId?: string;
  onCancel: () => void;
  onCaptured: (result: NativeCameraResult) => void;
}

export function NativeCameraModal({
  visible,
  requestId,
  onCancel,
  onCaptured,
}: NativeCameraModalProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);

  const takePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.78,
        exif: false,
        skipProcessing: false,
      });

      if (!photo?.base64) {
        throw new Error('相機未回傳照片資料');
      }

      onCaptured({
        requestId,
        base64: photo.base64,
        mimeType: 'image/jpeg',
        fileName: `camera-${Date.now()}.jpg`,
        width: photo.width,
        height: photo.height,
      });
    } catch (error) {
      Alert.alert(
        '拍照失敗',
        error instanceof Error ? error.message : '無法取得照片，請再試一次。'
      );
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black">
        {!permission ? (
          <View className="flex-1 items-center justify-center px-6">
            <ActivityIndicator size="large" />
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white mt-4">正在確認相機權限…</Text>
          </View>
        ) : !permission.granted ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white text-lg text-center mb-6">
              拍攝上傳照片需要相機權限。
            </Text>
            <Pressable
              onPress={requestPermission}
              className="bg-primary rounded-xl px-6 py-4"
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white text-lg font-semibold">允許使用相機</Text>
            </Pressable>
            <Pressable onPress={onCancel} className="mt-5 px-6 py-3">
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white text-base">取消</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing="back"
              mode="picture"
            />

            <View className="absolute top-0 left-0 right-0 px-5 pt-14 flex-row justify-between items-center">
              <Pressable
                onPress={onCancel}
                disabled={isCapturing}
                className="bg-black/60 rounded-full px-5 py-3"
              >
                <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white text-base">取消</Text>
              </Pressable>
            </View>

            <View className="absolute bottom-0 left-0 right-0 items-center pb-12 pt-8 bg-black/40">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="拍照"
                disabled={isCapturing}
                onPress={takePhoto}
                className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
              >
                <View className="w-16 h-16 rounded-full bg-white" />
              </Pressable>
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white mt-3">
                {isCapturing ? '照片處理中…' : '點一下拍照'}
              </Text>
            </View>

            {isCapturing ? (
              <View className="absolute inset-0 items-center justify-center bg-black/30">
                <ActivityIndicator size="large" color="#ffffff" />
              </View>
            ) : null}
          </>
        )}
      </View>
    </Modal>
  );
}
