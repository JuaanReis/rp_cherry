(() => {
  const icons = {
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 14.2A8.5 8.5 0 0 1 9.8 4a8.5 8.5 0 1 0 10.2 10.2Z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    whatsapp:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 11.5a9 9 0 0 1-13.4 7.9L3 21l1.5-4.6A9 9 0 1 1 21 11.5Z"/><path d="M8 7c-2 3 2 7 6 9l2-2-2-1-1 1c-2-1-3-2-3-3l1-1-1-3H8Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m15 4 5 5-11 11-6 1 1-6L15 4Z"/><path d="m12 7 5 5"/></svg>',
  };
  const escape = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const money = (cents) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  const storage = {
    get(key, fallback) {
      try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* Browsers may disable persistence. */
      }
    },
  };
  let timer;
  function toast(message) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => (el.hidden = true), 5000);
  }
  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (
      path.startsWith("/api/admin/") &&
      path !== "/api/admin/login" &&
      ["POST", "PUT", "DELETE", "PATCH"].includes(options.method || "GET") &&
      window.Cereja?.csrfToken
    )
      headers.set("X-CSRF-Token", window.Cereja.csrfToken);
    let response;
    try {
      response = await fetch(path, {
        ...options,
        headers,
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch {
      throw new Error(
        "Não foi possível conectar ao servidor. Tente novamente.",
      );
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("O servidor não respondeu como esperado.");
    }
    if (!response.ok) {
      if (
        response.status === 401 &&
        document.body.classList.contains("admin-body")
      )
        window.location.assign("/admin/login");
      let message = data.error || "Não foi possível concluir.";
      if (data.details?.length)
        message +=
          " " + data.details.map((e) => e.field + ": " + e.message).join(" ");
      throw new Error(message);
    }
    return data;
  }
  const json = (method, data) => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  function safeImage(url) {
    if (typeof url !== "string") return "";
    if (/^\/uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(url)) return url;
    try {
      const value = new URL(url);
      return ["https:", "http:"].includes(value.protocol) ? value.href : "";
    } catch {
      return "";
    }
  }
  function photo(product, cls = "") {
    const url = safeImage(product.image_url);
    if (url)
      return `<div class="${cls}"><img src="${escape(url)}" alt="${escape(product.name)}" loading="lazy" onerror="this.onerror=null;this.src='/static/assets/cherry.svg';this.style.objectFit='contain';this.style.padding='25%';"></div>`;
    if (
      Number.isInteger(product.atlas) &&
      product.atlas >= 0 &&
      product.atlas < 6
    )
      return `<div class="atlas atlas-${product.atlas} ${cls}" role="img" aria-label="${escape(product.name)}"></div>`;
    return `<div class="placeholder ${cls}"><img src="/static/assets/cherry.svg" alt="Foto não cadastrada"></div>`;
  }
  function paintIcons() {
    document
      .querySelectorAll("[data-icon]")
      .forEach((el) => (el.innerHTML = icons[el.dataset.icon] || ""));
  }
  function theme(value) {
    document.documentElement.dataset.theme = value;
    storage.set("cereja-theme", value);
    document.querySelectorAll("[data-theme-toggle]").forEach((el) => {
      const dark = value === "dark";
      el.innerHTML = icons[dark ? "sun" : "moon"];
      el.setAttribute("aria-pressed", String(dark));
      el.setAttribute(
        "aria-label",
        dark ? "Ativar fundo branco" : "Ativar fundo preto",
      );
      el.title = dark ? "Fundo branco" : "Fundo preto";
    });
  }
  theme(storage.get("cereja-theme", "dark") === "light" ? "light" : "dark");
  document
    .querySelectorAll("[data-theme-toggle]")
    .forEach((el) =>
      el.addEventListener("click", () =>
        theme(
          document.documentElement.dataset.theme === "dark" ? "light" : "dark",
        ),
      ),
    );
  document
    .querySelectorAll("[data-close]")
    .forEach((el) =>
      el.addEventListener("click", () =>
        document.getElementById(el.dataset.close).close(),
      ),
    );
  document.querySelectorAll("dialog").forEach((el) =>
    el.addEventListener("click", (e) => {
      if (e.target === el) {
        const r = el.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          el.close();
      }
    }),
  );
  function brand(settings) {
    document
      .querySelectorAll("[data-brand]")
      .forEach((el) => (el.textContent = settings.brand_name));
    document.title =
      settings.brand_name +
      (document.body.classList.contains("admin-body")
        ? " · Painel"
        : " · Lingerie");
  }
  async function openWhatsApp(items, button) {
    const previous = button?.innerHTML;
    // Open during the click, before awaiting the API, to avoid popup blockers.
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    if (button) {
      button.disabled = true;
      button.textContent = "Preparando pedido…";
    }
    try {
      const result = await request("/api/checkout", json("POST", { items }));
      if (tab) tab.location.replace(result.whatsapp_url);
      else window.location.assign(result.whatsapp_url);
    } catch (error) {
      if (tab) tab.close();
      toast(error.message);
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = previous;
      }
    }
  }
  paintIcons();
  document
    .getElementById("year")
    ?.replaceChildren(String(new Date().getFullYear()));
  window.Cereja = {
    icons,
    escape,
    money,
    storage,
    toast,
    request,
    json,
    safeImage,
    photo,
    paintIcons,
    brand,
    openWhatsApp,
  };
})();
