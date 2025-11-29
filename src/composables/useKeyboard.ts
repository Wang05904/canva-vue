// import { onMounted, onUnmounted } from 'vue'

export function useKeyboard() {
  const keyActions = {
    copy: () => {},
    paste: () => {},
    undo: () => {},
    redo: () => {}
  }

  return {
    keyActions
  }
}
