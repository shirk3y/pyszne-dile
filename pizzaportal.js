setLogger("pizzaportal");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FIND_PIZZAPORTAL_DEALS") {
    // log({ request });
    scrape(request.address, request.restaurant).then(
      ({ address, restaurant, meals }) =>
        sendResponse({ address, restaurant, meals })
    );

    return true;
  }
});

const scrape = async (address, restaurant) => {
  log("entering address", address);

  const normalizedRestaurant = normalizeRestaurantName(restaurant);

  const input = await queryOne(".singleAddress-input-container input");

  await fillInput(input, address);

  await click(".pp_address-suggestion-item:first-child");
  await click(".picker-address-form button");

  let found;

  (await queryAll(".restaurant-list li h2.restaurant-list-item-name")).forEach(
    node => {
      const name = normalizeRestaurantName(extractText(node));

      if (name === normalizedRestaurant) {
        log("Found restaurant:", restaurant);
        found = node;
      }
    }
  );

  if (!found) throw `Restaurant not found: ${restaurant}`;
  found.click();

  // await click(".dialog-popup-buttons .positive-button");

  let meals = {};

  (await queryAll(".restaurant-menu-product")).forEach(node => {
    const name = select("h3", { root: node, parse: normalizeMealName });
    meals[name] = {
      name,
      price: select(".restaurant-menu-product-price", {
        root: node,
        parse: parsePrice
      }),
      url: location.href
    };
  });

  log({ meals });

  return { meals };
};
