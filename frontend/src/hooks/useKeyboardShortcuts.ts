import { useHotkeys } from 'react-hotkeys-hook';
import { useTabStore } from '@/store/tabStore';

export function useKeyboardShortcuts() {
  const activeTabId = useTabStore((state) => state.activeTabId);
  const tabs = useTabStore((state) => state.tabs);
  const openQueryTab = useTabStore((state) => state.openQueryTab);
  const closeTab = useTabStore((state) => state.closeTab);
  const refreshTableData = useTabStore((state) => state.refreshTableData);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;

  useHotkeys('ctrl+t,meta+t', (event) => {
    event.preventDefault();
    openQueryTab();
  }, { enableOnFormTags: false });

  useHotkeys('ctrl+w,meta+w', (event) => {
    if (!activeTabId) {
      return;
    }
    event.preventDefault();
    closeTab(activeTabId);
  }, { enableOnFormTags: false }, [activeTabId]);

  useHotkeys('ctrl+r,meta+r,f5', (event) => {
    if (!activeTab) {
      return;
    }
    event.preventDefault();
    if (activeTab.mode === 'table') {
      refreshTableData(activeTab.id);
      return;
    }
    window.dispatchEvent(new CustomEvent('caskpg:run-query', { detail: { tabId: activeTab.id } }));
  }, { enableOnFormTags: false }, [activeTab]);

  useHotkeys('ctrl+s,meta+s', (event) => {
    if (!activeTab || activeTab.mode !== 'query') {
      return;
    }
    event.preventDefault();
    window.dispatchEvent(new CustomEvent('caskpg:save-query', { detail: { tabId: activeTab.id } }));
  }, { enableOnFormTags: false }, [activeTab]);
}
