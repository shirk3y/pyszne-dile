let subscribedTabIds = new Set();

const broadcastLog = async (logger, args) => {
  for (let tabId of subscribedTabIds) {
    await chrome.tabs.sendMessage(
      tabId,
      {
        type: "LOG_PUBLISH",
        args,
        logger
      },
      {}
    );
  }
};

const log = (...args) => broadcastLog("background", args);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case "LOG_SUBSCRIBE": {
      subscribedTabIds.add(sender.tab.id);

      break;
    }
    case "LOG_PUT": {
      broadcastLog(request.logger, request.args).then(sendResponse);

      return true;
    }
  }
});

chrome.tabs.onRemoved.addListener(tabId => {
  subscribedTabIds.delete(tabId);
});

chrome.runtime.onInstalled.addListener(function() {
  log("installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case "FIND_DEALS": {
      pizzaportalCheckPrices(request.address, request.restaurant).then(
        sendResponse
      );

      return true;
    }
  }
});

const pizzaportalCheckPrices = async (address, restaurant) => {
  const window = await chrome.windows.create({
    url: "https://pizzaportal.pl",
    state: "minimized"
  });

  const tabId = window.tabs[0].id;

  await chrome.tabs.executeScript(tabId, {
    code: "log('launching pizzaportal');"
  });

  chrome.windows.update(window.id, { state: "normal" });

  await chrome.windows.update(window.id, {
    state: "minimized"
  });

  await chrome.tabs.setZoom(tabId, 0.2);

  const response = await chrome.tabs.sendMessage(
    tabId,
    {
      type: "FIND_PIZZAPORTAL_DEALS",
      restaurant,
      address
    },
    {}
  );

  await chrome.tabs.setZoom(tabId, 1);
  await chrome.windows.remove(window.id);

  return response;
};
