import { useStorage } from '@vueuse/core';
import { ref, computed } from 'vue';

export default function useSessionStorage() {
  function useSessionProperty<T>(key: string, defaultValue: T) {
    const storageRef = useStorage<T>(key, defaultValue); // Explicitly specify the type
    const sessionProperty = computed(() => storageRef.value);

    function setSessionProperty(value: T) {
      storageRef.value = value;
    }

    function getSessionProperty() {
      return sessionProperty.value;
    }

    return {
      value: sessionProperty,
      setValue: setSessionProperty,
      getValue: getSessionProperty,
    };
  }

  return {
    useSessionProperty,
  };
}
