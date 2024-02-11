// TODO: Refactor to use modules.
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.action) {
    case "startTracking":
      startTracking();
      break;
    case "stopTracking":
      stopTracking();
      break;
    case "resetTracking":
      resetTracking();
      break;
  }
});

const SAVE_INTERVAL = 1000; // 60 seconds
const RESET_INVERVAL = 24 * 60 * 60 * 1000; // 24 hours

let saveTimeDateInterval: NodeJS.Timer | null = null;
let resetTimeDataInterval: NodeJS.Timer | null = null;

function startTracking() {
  saveTimeDateInterval = setInterval(saveTimeData, SAVE_INTERVAL);
  resetTimeDataInterval = setInterval(resetTimeData, RESET_INVERVAL);
  chrome.tabs.onActivated.addListener(tabActivatedListener);
  chrome.tabs.onUpdated.addListener(tabUpdateListener);
  chrome.windows.onFocusChanged.addListener(windowFocusChangedListener);
}

function stopTracking() {
  if (saveTimeDateInterval) clearInterval(saveTimeDateInterval);
  if (resetTimeDataInterval) clearInterval(resetTimeDataInterval);
  chrome.tabs.onActivated.removeListener(tabActivatedListener);
  chrome.tabs.onUpdated.removeListener(tabUpdateListener);
  chrome.windows.onFocusChanged.removeListener(windowFocusChangedListener);
}

function resetTracking() {
  resetTimeData();
  stopTracking();
  startTracking();
}

// App logic. 
// TODO: Refactor to use modules.

type TimeSpentOnDomains = {
  [domain: string]: number; // Represents the time counted in milliseconds.
}

type DomainTrack = {
  domain: string;
  startTime: number;
};

// TODO: Handle edge cases. 
// 1. User uses 2 windows at the same time.
let currentDomainTrack: DomainTrack | null = null;
let timeSpentOnDomains: TimeSpentOnDomains = {};

function tabUpdateListener(_: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
  stopCounting();

  if (!tab.active || !changeInfo.url) return;

  const domain = getDomain(changeInfo.url);

  if (!domain) return;

  startCounting(domain);
}

function tabActivatedListener(activeInfo: chrome.tabs.TabActiveInfo) {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (!tab.url) return;

    const domain = getDomain(tab.url);

    if (!domain) return;

    startCounting(domain);
  });
}

function windowFocusChangedListener(windowId: number) {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopCounting();
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentUrl = tabs[0]?.url;

      if (!currentUrl) return;

      const domain = getDomain(currentUrl);

      if (!domain) return;

      startCounting(domain);
    });
  }
}

function getDomain(url: string): string | null {
  try {
    const { hostname } = new URL(url);
    return hostname;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }

}
function startCounting(domain: string) {
  currentDomainTrack = { domain, startTime: Date.now() };
}

function stopCounting() {
  if (!currentDomainTrack) return;

  const countingTime = Date.now() - currentDomainTrack.startTime;
  const storedCountingTime = timeSpentOnDomains[currentDomainTrack.domain] || 0;
  timeSpentOnDomains[currentDomainTrack.domain] = storedCountingTime + countingTime;
  currentDomainTrack = null;
}

function saveTimeData() {
  const currentDomain = currentDomainTrack?.domain;

  stopCounting();

  if (currentDomain) {
    startCounting(currentDomain);
  }

  chrome.storage.local.set({ timeSpentOnDomains: JSON.stringify(timeSpentOnDomains) }, () => {
    console.log('Time data saved', timeSpentOnDomains);
  });
}

function resetTimeData() {
  timeSpentOnDomains = {};
  currentDomainTrack = null;
  chrome.storage.local.set({ timeSpentOnDomains: JSON.stringify({}) }, () => {
    console.log('Time data reseted');
  });
}
