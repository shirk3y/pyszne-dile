setLogger("pizzaportal");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FOO") {
    // log({ request });
    scrape(request.address, request.restaurant).then(
      ({ address, restaurant, meals }) =>
        sendResponse({ address, restaurant, meals }),
      error => log("Error", error)
    );

    return true;
  }
});

const scrape = async (address, restaurant) => {
  log("entering address", address);

  const normalizedRestaurant = normalizeRestaurantName(restaurant);

  const input = await queryOne(".singleAddress-input-container input");

  // await sleep(500);
  // await fillInput(input, "");
  // await sleep(100);
  await fillInput(input, address);
  // await sleep(100);

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

  await click(".dialog-popup-buttons .positive-button");

  let meals = {};

  (await queryAll(".restaurant-menu-product")).forEach(node => {
    const name = select("h3", { root: node, parse: normalizeMealName });
    meals[name] = {
      name,
      price: select(".restaurant-menu-product-price", {
        root: node,
        parse: parsePrice
      })
    };
  });

  log({ meals });

  return { meals };
};

/*

(await queryAll(".restaurant-list li h2.restaurant-list-item-name")).forEach(
  node => {
    const name = normalizeRestaurantName(extractText(node));

    if (name === normalizedRestaurant) {
      log("Found restaurant:", restaurant);
      found = node;
    }
  }
);

*/

// proc([query, "li"], [filter, item => item.id !== "foo"], [forEach, node => {
//   const name = await proc(node, extractText, normalizeRestaurantName)
// }]);
