const CART_STORAGE_KEY = "gameZoneCart";

let games = [];

document.addEventListener("DOMContentLoaded", async () => {
    updateCartCount();

    const currentPage = document.body.dataset.page;

    if (currentPage === "home") {
        await loadPopularGames();
    }

    if (currentPage === "store") {
        await loadStoreGames();
    }

    if (currentPage === "basket") {
        renderBasket();
        initializeCheckoutForm();
    }
});

/**
 * Завантаження ігор із JSON.
 */
async function getGames() {
    try {
        const response = await fetch("games.json");

        if (!response.ok) {
            throw new Error("Не вдалося завантажити games.json");
        }

        return await response.json();
    } catch (error) {
        console.error("Помилка завантаження ігор:", error);

        return [];
    }
}

/**
 * Завантаження популярних ігор.
 */
async function loadPopularGames() {
    const container = document.getElementById("popularGames");

    games = await getGames();

    if (games.length === 0) {
        container.innerHTML = `
            <p class="error-message">
                Не вдалося завантажити ігри.
            </p>
        `;

        return;
    }

    const popularGames = games
        .filter(game => game.popular)
        .slice(0, 3);

    renderGameCards(popularGames, container);
}

/**
 * Завантаження всіх ігор.
 */
async function loadStoreGames() {
    const container = document.getElementById("allGames");

    const searchInput =
        document.getElementById("searchInput");

    const genreFilter =
        document.getElementById("genreFilter");

    const platformFilter =
        document.getElementById("platformFilter");

    games = await getGames();

    if (games.length === 0) {
        container.innerHTML = `
            <p class="error-message">
                Не вдалося завантажити ігри.
            </p>
        `;

        return;
    }

    createGenreOptions();
    createPlatformOptions();

    renderGameCards(games, container);
    updateGamesResult(games.length);

    searchInput.addEventListener("input", filterGames);
    genreFilter.addEventListener("change", filterGames);
    platformFilter.addEventListener("change", filterGames);
}

/**
 * Виведення карток ігор.
 */
function renderGameCards(gameList, container) {
    if (gameList.length === 0) {
        container.innerHTML = `
            <p class="empty-message">
                За вашим запитом ігор не знайдено.
            </p>
        `;

        return;
    }

    container.innerHTML = gameList
        .map(game => createGameCard(game))
        .join("");

    const addButtons =
        container.querySelectorAll(".add-to-cart");

    addButtons.forEach(button => {
        button.addEventListener("click", () => {
            const gameId = Number(button.dataset.id);

            addToCart(gameId);
        });
    });
}

/**
 * Створення картки гри.
 */
function createGameCard(game) {
    return `
        <article class="game-card">
            <div class="game-image-wrapper">
                <img
                    src="${game.image}"
                    alt="${game.title}"
                    class="game-image"
                >
            </div>

            <div class="game-info">
                <div class="game-tags">
                    <span class="game-tag">
                        ${game.genre}
                    </span>

                    <span class="game-tag game-platform">
                        ${game.platform}
                    </span>
                </div>

                <h3 class="game-title">
                    ${game.title}
                </h3>

                <p class="game-description">
                    ${game.description}
                </p>

                <div class="game-bottom">
                    <span class="game-price">
                        ${formatPrice(game.price)}
                    </span>

                    <button
                        type="button"
                        class="add-to-cart"
                        data-id="${game.id}"
                    >
                        До кошика
                    </button>
                </div>
            </div>
        </article>
    `;
}

/**
 * Створення жанрів у select.
 */
function createGenreOptions() {
    const genreFilter =
        document.getElementById("genreFilter");

    const genres = [
        ...new Set(games.map(game => game.genre))
    ];

    genres.sort();

    genres.forEach(genre => {
        const option = document.createElement("option");

        option.value = genre;
        option.textContent = genre;

        genreFilter.appendChild(option);
    });
}

/**
 * Створення платформ у select.
 */
function createPlatformOptions() {
    const platformFilter =
        document.getElementById("platformFilter");

    const platforms = [
        ...new Set(games.map(game => game.platform))
    ];

    platforms.sort();

    platforms.forEach(platform => {
        const option = document.createElement("option");

        option.value = platform;
        option.textContent = platform;

        platformFilter.appendChild(option);
    });
}

/**
 * Фільтрація ігор.
 */
function filterGames() {
    const searchValue = document
        .getElementById("searchInput")
        .value
        .trim()
        .toLowerCase();

    const genreValue =
        document.getElementById("genreFilter").value;

    const platformValue =
        document.getElementById("platformFilter").value;

    const filteredGames = games.filter(game => {
        const matchesSearch =
            game.title.toLowerCase().includes(searchValue);

        const matchesGenre =
            genreValue === "all" ||
            game.genre === genreValue;

        const matchesPlatform =
            platformValue === "all" ||
            game.platform === platformValue;

        return (
            matchesSearch &&
            matchesGenre &&
            matchesPlatform
        );
    });

    const container =
        document.getElementById("allGames");

    renderGameCards(filteredGames, container);
    updateGamesResult(filteredGames.length);
}

/**
 * Виведення кількості знайдених ігор.
 */
function updateGamesResult(count) {
    const result =
        document.getElementById("gamesResult");

    if (!result) {
        return;
    }

    result.textContent = `Знайдено ігор: ${count}`;
}

/**
 * Додавання гри до кошика.
 */
function addToCart(gameId) {
    const selectedGame =
        games.find(game => game.id === gameId);

    if (!selectedGame) {
        return;
    }

    const cart = getCart();

    const existingGame =
        cart.find(item => item.id === gameId);

    if (existingGame) {
        existingGame.quantity += 1;
    } else {
        cart.push({
            id: selectedGame.id,
            title: selectedGame.title,
            genre: selectedGame.genre,
            platform: selectedGame.platform,
            price: selectedGame.price,
            image: selectedGame.image,
            quantity: 1
        });
    }

    saveCart(cart);
    updateCartCount();

    showNotification(
        `Гру «${selectedGame.title}» додано до кошика`
    );
}

/**
 * Отримання кошика.
 */
function getCart() {
    const cartData =
        localStorage.getItem(CART_STORAGE_KEY);

    if (!cartData) {
        return [];
    }

    try {
        return JSON.parse(cartData);
    } catch (error) {
        console.error("Помилка читання кошика:", error);

        return [];
    }
}

/**
 * Збереження кошика.
 */
function saveCart(cart) {
    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
    );
}

/**
 * Оновлення числа товарів у кошику.
 */
function updateCartCount() {
    const cart = getCart();

    const totalQuantity = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const counters =
        document.querySelectorAll(".cart-count");

    counters.forEach(counter => {
        counter.textContent = totalQuantity;
    });
}

/**
 * Виведення кошика.
 */
function renderBasket() {
    const basketContainer =
        document.getElementById("basketItems");

    const cart = getCart();

    if (cart.length === 0) {
        basketContainer.innerHTML = `
            <div class="empty-basket">
                <span class="empty-basket-icon">🎮</span>

                <h2>Ваш кошик порожній</h2>

                <p>
                    Перейдіть до магазину та додайте ігри,
                    які бажаєте придбати.
                </p>

                <a href="store.html" class="button">
                    Перейти до магазину
                </a>
            </div>
        `;

        updateBasketSummary(cart);
        toggleOrderButton(true);

        return;
    }

    basketContainer.innerHTML = `
        <div class="basket-items">
            ${cart.map(item => createBasketItem(item)).join("")}
        </div>
    `;

    addBasketEventListeners();
    updateBasketSummary(cart);
    toggleOrderButton(false);
}

/**
 * Створення товару в кошику.
 */
function createBasketItem(item) {
    const itemTotal =
        item.price * item.quantity;

    return `
        <article class="basket-item">
            <img
                src="${item.image}"
                alt="${item.title}"
                class="basket-item-image"
            >

            <div class="basket-item-info">
                <h3>${item.title}</h3>

                <p>
                    Жанр: ${item.genre}
                </p>

                <p>
                    Платформа: ${item.platform}
                </p>

                <p class="basket-item-price">
                    ${formatPrice(item.price)} за одну гру
                </p>
            </div>

            <div class="basket-item-actions">
                <div class="quantity-controls">
                    <button
                        type="button"
                        class="quantity-button decrease-button"
                        data-id="${item.id}"
                    >
                        −
                    </button>

                    <span class="quantity-value">
                        ${item.quantity}
                    </span>

                    <button
                        type="button"
                        class="quantity-button increase-button"
                        data-id="${item.id}"
                    >
                        +
                    </button>
                </div>

                <span class="item-total-price">
                    ${formatPrice(itemTotal)}
                </span>

                <button
                    type="button"
                    class="remove-button"
                    data-id="${item.id}"
                >
                    Видалити
                </button>
            </div>
        </article>
    `;
}

/**
 * Події кнопок у кошику.
 */
function addBasketEventListeners() {
    const increaseButtons =
        document.querySelectorAll(".increase-button");

    const decreaseButtons =
        document.querySelectorAll(".decrease-button");

    const removeButtons =
        document.querySelectorAll(".remove-button");

    increaseButtons.forEach(button => {
        button.addEventListener("click", () => {
            changeQuantity(
                Number(button.dataset.id),
                1
            );
        });
    });

    decreaseButtons.forEach(button => {
        button.addEventListener("click", () => {
            changeQuantity(
                Number(button.dataset.id),
                -1
            );
        });
    });

    removeButtons.forEach(button => {
        button.addEventListener("click", () => {
            removeFromCart(
                Number(button.dataset.id)
            );
        });
    });
}

/**
 * Зміна кількості гри.
 */
function changeQuantity(gameId, change) {
    const cart = getCart();

    const selectedItem =
        cart.find(item => item.id === gameId);

    if (!selectedItem) {
        return;
    }

    selectedItem.quantity += change;

    if (selectedItem.quantity <= 0) {
        const updatedCart =
            cart.filter(item => item.id !== gameId);

        saveCart(updatedCart);
    } else {
        saveCart(cart);
    }

    updateCartCount();
    renderBasket();
}

/**
 * Видалення гри.
 */
function removeFromCart(gameId) {
    const cart = getCart();

    const updatedCart =
        cart.filter(item => item.id !== gameId);

    saveCart(updatedCart);
    updateCartCount();
    renderBasket();
}

/**
 * Оновлення суми замовлення.
 */
function updateBasketSummary(cart) {
    const totalQuantityElement =
        document.getElementById("totalQuantity");

    const totalPriceElement =
        document.getElementById("totalPrice");

    const totalQuantity = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const totalPrice = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    totalQuantityElement.textContent =
        totalQuantity;

    totalPriceElement.textContent =
        formatPrice(totalPrice);
}

/**
 * Оформлення покупки.
 */
function initializeCheckoutForm() {
    const checkoutForm =
        document.getElementById("checkoutForm");

    checkoutForm.addEventListener("submit", event => {
        event.preventDefault();

        const cart = getCart();

        if (cart.length === 0) {
            alert("Ваш кошик порожній.");

            return;
        }

        const customerName =
            document
                .getElementById("customerName")
                .value
                .trim();

        const customerEmail =
            document
                .getElementById("customerEmail")
                .value
                .trim();

        const paymentMethod =
            document
                .getElementById("paymentMethod")
                .value;

        if (
            !customerName ||
            !customerEmail ||
            !paymentMethod
        ) {
            alert("Заповніть усі поля форми.");

            return;
        }

        alert(
            `Дякуємо, ${customerName}!\n` +
            `Вашу покупку успішно підтверджено.\n` +
            `Інформацію надіслано на ${customerEmail}.`
        );

        localStorage.removeItem(CART_STORAGE_KEY);

        checkoutForm.reset();
        updateCartCount();
        renderBasket();
    });
}

/**
 * Блокування кнопки замовлення.
 */
function toggleOrderButton(disabled) {
    const orderButton =
        document.querySelector(".order-button");

    if (orderButton) {
        orderButton.disabled = disabled;
    }
}

/**
 * Повідомлення про додавання гри.
 */
function showNotification(message) {
    const notification =
        document.getElementById("notification");

    if (!notification) {
        return;
    }

    notification.textContent = message;
    notification.classList.add("show");

    setTimeout(() => {
        notification.classList.remove("show");
    }, 2200);
}

/**
 * Форматування ціни.
 */
function formatPrice(price) {
    return `${price.toLocaleString("uk-UA")} грн`;
}