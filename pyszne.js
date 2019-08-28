setLogger("pyszne");
subscribeToLogs();

let prevRestaurant = "";

setInterval(() => {
  const restaurant = select(".restaurant-name h1");
  const address = select(".show-location");

  if (restaurant === prevRestaurant) return;
  if (!address) return;

  let meals = {};

  document.querySelectorAll(".meal-container").forEach(mealNode => {
    const id = mealNode.id;
    meals[id] = {
      id,
      name: select(".meal-name", {
        root: mealNode,
        parse: [normalizeMealName, normalizeText]
      }),
      price: select(".meal__price", { root: mealNode, parse: parsePrice })
    };
  });

  chrome.runtime.sendMessage(
    { type: "PIZZAPORTAL_CHECK_PRICES", restaurant, address },
    response => {
      log({ response });

      if (!response) return;

      Object.values(response.meals).forEach(altMeal => {
        const match = Object.values(meals).find(
          meal => meal.name === altMeal.name
        );

        if (match) {
          log("match", { match, altMeal });
          const altNode = document.createElement("a");
          altNode.className = "__alt-price__";
          altNode.innerHTML = formatPrice(altMeal.price);
          altNode.href = "https://pizzaportal.pl";

          node = document
            .getElementById(match.id)
            .querySelector(".meal__price");

          if (altMeal.price < match.price) {
            node.classList.add("__sale__");
          }
          node.appendChild(altNode);
        }
      });
    }
  );
  log({ restaurant, address, meals });

  prevRestaurant = restaurant;
}, 500);
