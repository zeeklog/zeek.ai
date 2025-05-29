import { useRecoilCallback } from 'recoil';
import { clearLocalStorage } from '~/utils/localStorage';
import store from '~/store';
import { Constants, LocalStorageKeys } from 'librechat-data-provider';

export default function useClearStates() {
  const clearConversations = store.useClearConvoState();
  const clearSubmissions = store.useClearSubmissionState();
  const clearLatestMessages = store.useClearLatestMessages();

  const clearStates = useRecoilCallback(
    ({ reset, snapshot }) =>
      async (skipFirst?: boolean) => {
        await clearSubmissions(skipFirst);
        await clearConversations(skipFirst);
        await clearLatestMessages(skipFirst);

        const keys = await snapshot.getPromise(store.conversationKeysAtom);

        for (const key of keys) {
          if (skipFirst === true && key === 0) {
            continue;
          }

          reset(store.filesByIndex(key));
          reset(store.presetByIndex(key));
          reset(store.textByIndex(key));
          reset(store.showStopButtonByIndex(key));
          reset(store.abortScrollFamily(key));
          reset(store.isSubmittingFamily(key));
          reset(store.optionSettingsFamily(key));
          reset(store.showAgentSettingsFamily(key));
          reset(store.showPopoverFamily(key));
          reset(store.showMentionPopoverFamily(key));
          reset(store.showPlusPopoverFamily(key));
          reset(store.showPromptsPopoverFamily(key));
          reset(store.activePromptByIndex(key));
          reset(store.globalAudioURLFamily(key));
          reset(store.globalAudioFetchingFamily(key));
          reset(store.globalAudioPlayingFamily(key));
          reset(store.activeRunFamily(key));
          reset(store.audioRunFamily(key));
          reset(store.messagesSiblingIdxFamily(key.toString()));
        }

        // 清理本地存储中的用户认证信息（使用环境变量中定义的 key）
        localStorage.removeItem(import.meta.env.VITE_ENV_CACHE_TOKEN_KEY);
        localStorage.removeItem(import.meta.env.VITE_ENV_CACHE_USER_KEY);
        
        // 清理其他本地存储
        clearLocalStorage(skipFirst);
      },
    [],
  );

  return clearStates;
}
