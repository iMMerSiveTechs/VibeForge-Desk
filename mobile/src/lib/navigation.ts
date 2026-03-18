import { InteractionManager } from 'react-native';
import { router } from 'expo-router';

export function deferredNavigate(href: Parameters<typeof router.push>[0]) {
  InteractionManager.runAfterInteractions(() => {
    router.push(href);
  });
}
