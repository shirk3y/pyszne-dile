// logHere();

let subscribedTabIds = new Set();

const broadcastLog = (logger, args) => {
  subscribedTabIds.forEach(tabId => {
    chrome.tabs.sendMessage(tabId, {
      type: "LOG_PUBLISH",
      args,
      logger
    });
  });
};

const log = (...args) => broadcastLog("background", args);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case "LOG_SUBSCRIBE": {
      subscribedTabIds.add(sender.tab.id);

      break;
    }
    case "LOG_PUT": {
      broadcastLog(request.logger, request.args);

      break;
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
    case "PIZZAPORTAL_CHECK_PRICES": {
      log(request.type);

      const { restaurant, address } = request;

      chrome.tabs.create(
        { url: "https://pizzaportal.pl", active: false },
        tab => {
          chrome.tabs.executeScript(
            tab.id,
            // { code: "new Promise(resolve => setTimeout(resolve, 1000))" },
            { code: "log && log('injecting');" },
            () => {
              chrome.tabs.sendMessage(
                tab.id,
                { type: "FOO", restaurant, address },
                response => {
                  sendResponse(response);
                }
              );
            }
          );
        }
      );

      return true;
    }
  }
});
