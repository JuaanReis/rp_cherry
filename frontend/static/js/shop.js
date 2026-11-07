(() => {
  const C = window.Cereja;
  let products = [],
    categories = [],
    settings = null,
    category = "Todos",
    selectedSize = "",
    detailProduct = null;
  const el = (id) => document.getElementById(id);
  const normalize = (text) =>
    String(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();
  const saved = C.storage.get("cereja-cart", []);
  let cart = Array.isArray(saved)
    ? saved
        .filter(
          (i) =>
            i &&
            typeof i.product_id === "string" &&
            typeof i.size === "string" &&
            Number.isInteger(i.quantity) &&
            i.quantity > 0 &&
            i.quantity <= 99,
        )
        .slice(0, 50)
    : [];
  const productDialog = document.getElementById("product-dialog"),
    cartDialog = document.getElementById("cart-dialog");
  function saveCart() {
    C.storage.set("cereja-cart", cart);
    document.getElementById("cart-count").textContent = cart.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
  }
  function paintCatalog() {
    const query = normalize(el("product-search").value),
      size = el("size-filter").value,
      color = el("color-filter").value;
    let minimum,
      maximum,
      filterError = "";
    try {
      minimum = filterPrice(el("price-min").value);
      maximum = filterPrice(el("price-max").value);
      if (minimum !== null && maximum !== null && minimum > maximum)
        throw new Error("O preço mínimo precisa ser menor ou igual ao máximo.");
    } catch (error) {
      filterError = error.message;
    }
    el("filter-error").textContent = filterError;
    el("filter-error").hidden = !filterError;
    const visible = filterError
      ? []
      : products.filter(
          (p) =>
            (category === "Todos" || p.category === category) &&
            (!query || normalize(p.name).includes(query)) &&
            (!size || p.sizes.includes(size)) &&
            (!color || p.color === color) &&
            (minimum === null || p.price_cents >= minimum) &&
            (maximum === null || p.price_cents <= maximum) &&
            (!el("stock-filter").checked || p.stock > 0),
        );
    const order = el("product-sort").value;
    visible.sort((a, b) =>
      order === "price-asc"
        ? a.price_cents - b.price_cents
        : order === "price-desc"
          ? b.price_cents - a.price_cents
          : order === "name"
            ? a.name.localeCompare(b.name, "pt-BR")
            : Number(b.featured) - Number(a.featured),
    );
    document.getElementById("collection-count").textContent =
      `${visible.length} ${visible.length === 1 ? "peça" : "peças"}`;
    const categoryNames = ["Todos", ...categories.map((c) => c.name)];
    document.getElementById("filters").innerHTML = categoryNames
      .map(
        (v) =>
          `<button class="filter" data-category="${C.escape(v)}" aria-pressed="${category === v}">${C.escape(v)}</button>`,
      )
      .join("");
    document.getElementById("products").innerHTML = visible.length
      ? visible
          .map(
            (p) =>
              `<article class="product-card"><button class="product-picture" data-product="${p.id}" aria-label="Ver ${C.escape(p.name)}">${C.photo(p)}${p.stock === 0 ? '<span class="product-badge">Esgotado</span>' : p.compare_price_cents ? '<span class="product-badge">Preço especial</span>' : p.featured ? '<span class="product-badge">Nossa escolha</span>' : ""}</button><div class="product-meta"><span>${C.escape(p.category)}</span><span>${C.escape(p.sizes.join(" · "))}</span></div><h3>${C.escape(p.name)}</h3><div class="price-line">${C.money(p.price_cents)}${p.compare_price_cents ? `<del>${C.money(p.compare_price_cents)}</del>` : ""}</div><button class="button button-outline" data-product="${p.id}">${p.stock ? "Escolher peça" : "Ver detalhes"}</button></article>`,
          )
          .join("")
      : `<div class="empty-state">${filterError ? "Confira os filtros de preço." : products.length ? "Nenhuma peça combina com esses filtros." : "Novas peças chegam em breve."}</div>`;
  }
  function filterPrice(value) {
    let text = value.trim().replace(/\s/g, "");
    if (!text) return null;
    if (text.includes(",")) text = text.replace(/\./g, "").replace(",", ".");
    if (!/^\d+(\.\d{0,2})?$/.test(text))
      throw new Error("Informe o preço como 129,90.");
    const cents = Math.round(Number(text) * 100);
    if (!Number.isSafeInteger(cents))
      throw new Error("Confira o valor do preço.");
    return cents;
  }
  function filterOptions() {
    const sizes = [...new Set(products.flatMap((p) => p.sizes))],
      colors = [...new Set(products.map((p) => p.color).filter(Boolean))];
    for (const [id, values, label] of [
      ["size-filter", sizes, "Todos"],
      ["color-filter", colors, "Todas"],
    ]) {
      const previous = el(id).value;
      el(id).innerHTML =
        `<option value="">${label}</option>` +
        values
          .map((v) => `<option value="${C.escape(v)}">${C.escape(v)}</option>`)
          .join("");
      if (values.includes(previous)) el(id).value = previous;
    }
  }
  function socialLinks() {
    const links = [];
    if (settings.instagram_enabled && settings.instagram_profile)
      links.push(
        `<a href="https://www.instagram.com/${encodeURIComponent(settings.instagram_profile)}/" target="_blank" rel="noopener noreferrer">Instagram</a>`,
      );
    if (settings.tiktok_enabled && settings.tiktok_profile)
      links.push(
        `<a href="https://www.tiktok.com/@${encodeURIComponent(settings.tiktok_profile)}" target="_blank" rel="noopener noreferrer">TikTok</a>`,
      );
    el("social-links").innerHTML = links.join("");
    el("social-links").hidden = !links.length;
  }
  async function loadCatalog() {
    document.getElementById("catalog-error").hidden = true;
    try {
      [products, settings, categories] = await Promise.all([
        C.request("/api/products"),
        C.request("/api/settings"),
        C.request("/api/categories"),
      ]);
      C.brand(settings);
      if (category !== "Todos" && !categories.some((c) => c.name === category))
        category = "Todos";
      filterOptions();
      socialLinks();
      paintCatalog();
      paintCart();
    } catch (error) {
      document.getElementById("products").innerHTML = "";
      document.getElementById("collection-count").textContent =
        "Coleção indisponível";
      document.getElementById("catalog-error").hidden = false;
      C.toast(error.message);
    }
  }
  function openProduct(id) {
    detailProduct = products.find((p) => p.id === id);
    if (!detailProduct) return;
    selectedSize = "";
    const p = detailProduct;
    document.getElementById("product-detail").innerHTML =
      `<div class="detail-layout">${C.photo(p, "detail-image")}<div class="detail-content"><p class="eyebrow">${C.escape(p.category)}${p.color ? " · " + C.escape(p.color) : ""}</p><h2 id="detail-name">${C.escape(p.name)}</h2><div class="price-line">${C.money(p.price_cents)}${p.compare_price_cents ? `<del>${C.money(p.compare_price_cents)}</del>` : ""}</div><p class="detail-description">${C.escape(p.description)}</p><span class="field-title" id="size-label">Escolha o tamanho</span><div class="size-options" role="group" aria-labelledby="size-label">${p.sizes.map((size) => `<button class="size-option" data-size="${C.escape(size)}" aria-pressed="false">${C.escape(size)}</button>`).join("")}</div><label class="field-title" for="detail-qty">Quantidade</label><input class="qty-input" id="detail-qty" type="number" min="1" max="${Math.min(p.stock, 99) || 1}" value="1" ${p.stock ? "" : "disabled"}><p class="detail-stock">${p.stock ? "Disponível para pedir." : "Esta peça está esgotada no momento."}</p><div class="detail-actions"><button class="button button-primary" id="add-to-cart" ${p.stock ? "" : "disabled"}>Adicionar à sacola</button><button class="button button-outline" id="buy-now" ${p.stock ? "" : "disabled"}>${C.icons.whatsapp}Pedir só esta peça</button></div></div></div>`;
    productDialog.showModal();
    C.request("/api/products/" + encodeURIComponent(id) + "/view", {
      method: "POST",
    }).catch(() => {});
  }
  function selectedItem() {
    if (!selectedSize) {
      C.toast("Escolha um tamanho primeiro.");
      return null;
    }
    const quantity = Number(document.getElementById("detail-qty").value);
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99 ||
      quantity > detailProduct.stock
    ) {
      C.toast("Confira a quantidade e o estoque disponível.");
      return null;
    }
    return { product_id: detailProduct.id, size: selectedSize, quantity };
  }
  function addToCart() {
    const item = selectedItem();
    if (!item) return;
    const total =
      cart
        .filter((i) => i.product_id === item.product_id)
        .reduce((sum, i) => sum + i.quantity, 0) + item.quantity;
    if (total > detailProduct.stock) {
      C.toast("Essa quantidade ultrapassa o estoque da peça.");
      return;
    }
    const existing = cart.find(
      (i) => i.product_id === item.product_id && i.size === item.size,
    );
    if (existing) {
      if (existing.quantity + item.quantity > 99) {
        C.toast("Use até 99 unidades por tamanho.");
        return;
      }
      existing.quantity += item.quantity;
    } else if (cart.length >= 50) {
      C.toast("Sua sacola já tem 50 opções.");
      return;
    } else cart.push(item);
    saveCart();
    paintCart();
    productDialog.close();
    C.toast("Peça adicionada à sacola.");
  }
  function paintCart() {
    let total = 0,
      unavailable = false;
    document.getElementById("cart-items").innerHTML = cart.length
      ? cart
          .map((item, index) => {
            const p = products.find((p) => p.id === item.product_id),
              valid = p && p.stock > 0 && p.sizes.includes(item.size);
            if (!valid) unavailable = true;
            if (p) total += p.price_cents * item.quantity;
            return `<article class="cart-item">${p ? C.photo(p, "cart-thumb") : '<div class="cart-thumb placeholder">—</div>'}<div><h3>${C.escape(p?.name || "Peça indisponível")}</h3><p class="muted">Tamanho ${C.escape(item.size)}${p?.color ? " · " + C.escape(p.color) : ""}</p><p class="cart-item-price">${p ? C.money(p.price_cents * item.quantity) : "Remova esta peça"}${!valid ? " · Indisponível" : ""}</p><div class="cart-item-actions"><div class="quantity-control"><button data-qty="-1" data-index="${index}" aria-label="Diminuir quantidade de ${C.escape(p?.name || "peça")}">−</button><span>${item.quantity}</span><button data-qty="1" data-index="${index}" aria-label="Aumentar quantidade de ${C.escape(p?.name || "peça")}">+</button></div><button class="remove-item" data-remove="${index}">Remover</button></div></div></article>`;
          })
          .join("")
      : '<div class="empty-state" style="margin-top:24px"><p>Sua sacola ainda está vazia.</p><p style="font-size:14px;margin-top:9px">Escolha uma peça para começar.</p></div>';
    document.getElementById("cart-total").textContent = C.money(total);
    document.getElementById("checkout-cart").disabled =
      !cart.length || unavailable;
    saveCart();
  }
  document.getElementById("filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-category]");
    if (b) {
      category = b.dataset.category;
      paintCatalog();
    }
  });
  ["product-search", "price-min", "price-max"].forEach((id) =>
    el(id).addEventListener("input", paintCatalog),
  );
  ["size-filter", "color-filter", "stock-filter", "product-sort"].forEach(
    (id) => el(id).addEventListener("change", paintCatalog),
  );
  el("clear-filters").addEventListener("click", () => {
    [
      "product-search",
      "price-min",
      "price-max",
      "size-filter",
      "color-filter",
    ].forEach((id) => (el(id).value = ""));
    el("stock-filter").checked = false;
    el("product-sort").value = "featured";
    category = "Todos";
    paintCatalog();
  });
  document.getElementById("products").addEventListener("click", (e) => {
    const b = e.target.closest("[data-product]");
    if (b) openProduct(b.dataset.product);
  });
  document.getElementById("product-detail").addEventListener("click", (e) => {
    const size = e.target.closest("[data-size]");
    if (size) {
      selectedSize = size.dataset.size;
      document
        .querySelectorAll("[data-size]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === size)));
    }
    if (e.target.closest("#add-to-cart")) addToCart();
    const buy = e.target.closest("#buy-now");
    if (buy) {
      const item = selectedItem();
      if (item) C.openWhatsApp([item], buy);
    }
  });
  document.getElementById("open-cart").addEventListener("click", () => {
    paintCart();
    cartDialog.showModal();
  });
  document.getElementById("cart-items").addEventListener("click", (e) => {
    const remove = e.target.closest("[data-remove]");
    if (remove) {
      cart.splice(Number(remove.dataset.remove), 1);
      paintCart();
      return;
    }
    const qty = e.target.closest("[data-qty]");
    if (!qty) return;
    const item = cart[Number(qty.dataset.index)];
    if (!item) return;
    const n = item.quantity + Number(qty.dataset.qty);
    if (n < 1) {
      cart.splice(Number(qty.dataset.index), 1);
      paintCart();
      return;
    }
    const p = products.find((p) => p.id === item.product_id);
    const other = cart
      .filter((i) => i !== item && i.product_id === item.product_id)
      .reduce((s, i) => s + i.quantity, 0);
    if (!p || n > 99 || n + other > p.stock) {
      C.toast("Essa quantidade ultrapassa o estoque disponível.");
      return;
    }
    item.quantity = n;
    paintCart();
  });
  document
    .getElementById("checkout-cart")
    .addEventListener("click", (e) => C.openWhatsApp(cart, e.currentTarget));
  document.querySelectorAll("[data-contact]").forEach((b) =>
    b.addEventListener("click", () => {
      if (!settings?.whatsapp) {
        C.toast("O WhatsApp da loja ainda não foi configurado.");
        return;
      }
      window.open(
        `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre as peças.")}`,
        "_blank",
        "noopener,noreferrer",
      );
    }),
  );
  document
    .getElementById("reload-catalog")
    .addEventListener("click", loadCatalog);
  window.addEventListener("storage", (e) => {
    if (e.key === "cereja-cart") {
      const value = C.storage.get("cereja-cart", []);
      if (Array.isArray(value)) {
        cart = value
          .filter(
            (i) =>
              i &&
              typeof i.product_id === "string" &&
              typeof i.size === "string" &&
              Number.isInteger(i.quantity) &&
              i.quantity > 0 &&
              i.quantity <= 99,
          )
          .slice(0, 50);
        paintCart();
      }
    }
  });
  // Returning from WhatsApp refreshes prices and availability from Python.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") loadCatalog();
  });
  function typingText() {
    const text = el("typed-text"),
      phrases = [
        "Conforto para o seu dia.",
        "Delicadeza, do seu jeito.",
        "Escolha aqui. Combine no WhatsApp.",
      ];
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      text.textContent = phrases[0];
      return;
    }
    let phrase = 0,
      position = phrases[0].length,
      erasing = true,
      timer;
    function tick() {
      if (document.visibilityState === "hidden") return;
      if (erasing) {
        position--;
        text.textContent = phrases[phrase].slice(0, Math.max(position, 0));
        if (position <= 0) {
          erasing = false;
          phrase = (phrase + 1) % phrases.length;
          timer = setTimeout(tick, 450);
          return;
        }
      } else {
        position++;
        text.textContent = phrases[phrase].slice(0, position);
        if (position >= phrases[phrase].length) {
          erasing = true;
          timer = setTimeout(tick, 2200);
          return;
        }
      }
      timer = setTimeout(tick, erasing ? 45 : 80);
    }
    timer = setTimeout(tick, 2200);
    document.addEventListener("visibilitychange", () => {
      clearTimeout(timer);
      if (document.visibilityState === "visible") timer = setTimeout(tick, 700);
    });
  }
  typingText();
  saveCart();
  loadCatalog();
})();
