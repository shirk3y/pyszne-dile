// Logs

let logger = "common";

const setLogger = name => {
  logger = name;
};

const log = (...args) => {
  chrome.runtime.sendMessage({ type: "LOG_PUT", logger, args });
};

const subscribeToLogs = () => {
  chrome.runtime.sendMessage({ type: "LOG_SUBSCRIBE" });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "LOG_PUBLISH") {
      console.log(`[${request.logger}]`, ...request.args);
    }
  });
};

// Scraping

const ensureArray = value =>
  Array.isArray(value) ? value : value ? [value] : [];

const pipe = (value, ...processors) => {
  let nextValue = value;

  processors.forEach(processor => {
    const [process, ...args] = ensureArray(processor);

    nextValue = process(nextValue, ...args);

    if (nextValue === undefined) {
      return;
    }
  });

  return nextValue;
};

const parsePrice = priceText => {
  return parseInt(priceText.replace(/[^0-9]/, ""), 10);
};

const formatPrice = price => (price / 100).toFixed(2).replace(".", ",") + " zł";

const normalizeMealName = text => text.replace(/pizza/i, "");

const normalizeText = text => text.replace(/\s{2,}/g, " ").trim();

const normalizeRestaurantName = text => normalizeText(text).toLowerCase();

const extractText = node => (node ? node.textContent : "");

const select = (selector, { root = document, parse } = {}) => {
  const node = root.querySelector(selector);

  const text = normalizeText(extractText(node));

  return pipe(
    text,
    ...ensureArray(parse)
  );
};

const queryAll = async (
  selector,
  { wait = 10000, ignoreNotFound = false } = {}
) =>
  new Promise((resolve, reject) => {
    const deadline = new Date().getTime() + wait;

    const interval = setInterval(() => {
      const nodes = document.querySelectorAll(selector);

      if (nodes.length) {
        clearInterval(interval);
        resolve(nodes);
      } else if (new Date().getTime() > deadline) {
        clearInterval(interval);
        if (ignoreNotFound) {
          resolve(undefined);
        } else {
          reject(`Element not found: ${selector}`);
        }
      }
    }, 100);
  });

const query = (selector, options) =>
  queryAll(selector, options).then(nodes => nodes[0]);

const queryOne = (selector, options) =>
  queryAll(selector, options).then(nodes => {
    if (nodes.length > 1)
      throw new Error(`More than one match: ${nodes.length}`);

    return nodes[0];
  });

const sleep = duration => new Promise(resolve => setTimeout(resolve, duration));

const sendKey = (input, key) => {
  input.dispatchEvent(new KeyboardEvent("keypress", { key }));
  input.dispatchEvent(new KeyboardEvent("keydown", { key }));
  input.dispatchEvent(new KeyboardEvent("keyup", { key }));
};

const typeText = (input, text) =>
  asyncForEach(text.split(""), async char => {
    sendKey(input, char);

    log("type", char);

    await sleep(50);
  });

const fillInput = async (input, text) => {
  let lastValue = input.value;

  // input.click();
  // input.focus();
  input.value = text;

  let event = new Event("change", { bubbles: true });
  // hack React15
  event.simulated = true;
  // hack React16
  let tracker = input._valueTracker;
  if (tracker) {
    tracker.setValue(lastValue);
  }

  input.dispatchEvent(event);
};

const click = async (selector, options) => {
  const node = await queryOne(selector, options);
  node.click();
  return node;
};
