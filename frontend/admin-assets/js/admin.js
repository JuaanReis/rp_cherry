(() => {
  const C = window.Cereja;
  let products = [],
    categories = [],
    settings = {},
    photoUrl = "",
    atlas = null,
    uploading = false,
    editorVersion = 0;
  const form = document.getElementById("product-form"),
    dialog = document.getElementById("editor-dialog");
  const trash =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></svg>';
  const copy =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 8h13v13H8zM16 8V3H3v13h5"/></svg>';
  const el = (id) => document.getElementById(id);
  function screen(name) {
    ["dashboard", "catalog", "settings"].forEach(
      (v) => (el("screen-" + v).hidden = name !== v),
    );
    document
      .querySelectorAll(".side-link")
      .forEach((b) =>
        b.classList.toggle("selected", b.dataset.screen === name),
      );
    if (name === "dashboard") refreshDashboard();
  }
  function paint() {
    el("stat-total").textContent = products.length;
    el("stat-active").textContent = products.filter(
      (p) => p.status === "active",
    ).length;
    el("stat-stock").textContent = products.reduce(
      (sum, p) => sum + p.stock,
      0,
    );
    const query = el("admin-search").value.trim().toLocaleLowerCase("pt-BR"),
      filter = el("admin-filter").value;
    const rows = products.filter(
      (p) =>
        `${p.name} ${p.category} ${p.color}`
          .toLocaleLowerCase("pt-BR")
          .includes(query) &&
        (filter === "all" ||
          (filter === "empty" && p.stock === 0) ||
          p.status === filter),
    );
    el("admin-list").innerHTML = rows.length
      ? '<div class="list-head"><span>Peça</span><span>Preço</span><span>Estoque</span><span>Publicação</span><span>Ações</span></div>' +
        rows
          .map(
            (p) =>
              `<article class="admin-row"><div class="piece-cell">${C.photo(p, "admin-thumb")}<div><h3>${C.escape(p.name)}</h3><p class="muted">${C.escape(p.category)} · ${C.escape(p.sizes.join(", "))}</p></div></div><span class="row-price">${C.money(p.price_cents)}</span><span class="row-stock">${p.stock}</span><span class="row-status"><span class="status-badge ${p.status}">${p.status === "active" ? "Na vitrine" : "Rascunho"}</span></span><div class="row-actions"><button data-edit="${p.id}" title="Editar peça" aria-label="Editar ${C.escape(p.name)}">${C.icons.edit}</button><button data-copy="${p.id}" title="Duplicar como rascunho" aria-label="Duplicar ${C.escape(p.name)}">${copy}</button><button data-delete="${p.id}" title="Excluir peça" aria-label="Excluir ${C.escape(p.name)}">${trash}</button></div></article>`,
          )
          .join("")
      : '<p class="empty-state">Nenhuma peça encontrada.</p>';
  }
  async function load() {
    try {
      const session = await C.request("/api/admin/session");
      C.csrfToken = session.csrf_token;
      [products, settings, categories] = await Promise.all([
        C.request("/api/admin/products"),
        C.request("/api/settings"),
        C.request("/api/admin/categories"),
      ]);
      paint();
      C.brand(settings);
      el("brand-name").value = settings.brand_name;
      el("whatsapp").value = settings.whatsapp;
      el("setup-note").hidden = Boolean(settings.whatsapp);
      el("instagram-enabled").checked = settings.instagram_enabled;
      el("instagram-profile").value = settings.instagram_profile;
      el("tiktok-enabled").checked = settings.tiktok_enabled;
      el("tiktok-profile").value = settings.tiktok_profile;
      socialFields();
      paintCategories();
      await refreshDashboard();
    } catch (error) {
      el("admin-list").innerHTML =
        '<p class="empty-state">Não foi possível carregar o painel. Recarregue a página para tentar novamente.</p>';
      C.toast(error.message);
    }
  }
  function socialFields() {
    ["instagram", "tiktok"].forEach((network) => {
      el(network + "-profile").required = el(network + "-enabled").checked;
    });
  }
  function paintCategories() {
    el("category").innerHTML = categories
      .map(
        (c) =>
          `<option value="${C.escape(c.name)}">${C.escape(c.name)}</option>`,
      )
      .join("");
    el("new-product").disabled = !categories.length;
    el("category-list").innerHTML = categories.length
      ? categories
          .map(
            (c) =>
              `<div class="category-row"><div>${C.escape(c.name)}<small>${c.product_count} ${c.product_count === 1 ? "peça" : "peças"}</small></div><button data-delete-category="${c.id}">Excluir</button></div>`,
          )
          .join("")
      : '<p class="dashboard-empty">Adicione uma categoria para cadastrar novas peças.</p>';
  }
  function ranks(id, rows, key, suffix, empty) {
    const maximum = Math.max(1, ...rows.map((r) => r[key]));
    el(id).innerHTML = rows.length
      ? rows
          .map(
            (r) =>
              `<div class="rank-item"><div class="rank-label"><span>${C.escape(r.name)}</span><strong>${r[key]} ${suffix}</strong></div><div class="rank-track" aria-hidden="true"><div class="rank-fill" style="width:${(r[key] / maximum) * 100}%"></div></div></div>`,
          )
          .join("")
      : `<p class="dashboard-empty">${empty}</p>`;
  }
  function paintDashboard(data) {
    el("dash-products").textContent = data.total_products;
    el("dash-stock").textContent = data.stock_units;
    el("dash-average").textContent = C.money(data.average_price_cents);
    el("dash-views").textContent = data.views_14_days;
    const maximum = Math.max(1, ...data.daily_views.map((v) => v.views));
    el("daily-chart").innerHTML = data.daily_views
      .map((v, i) => {
        const [, m, d] = v.day.split("-");
        return `<div class="daily-column" role="img" aria-label="${d}/${m}: ${v.views} visualizações"><span class="daily-value">${v.views}</span><div class="daily-bar" style="height:${(v.views / maximum) * 130}px"></div><span class="daily-label">${i % 2 === 0 || i === 13 ? d + "/" + m : ""}</span></div>`;
      })
      .join("");
    ranks(
      "most-viewed",
      data.most_viewed,
      "views",
      "visualizações",
      "Ainda não há visualizações de peças.",
    );
    ranks(
      "most-stock",
      data.most_stock,
      "stock",
      "un.",
      "O catálogo ainda está vazio.",
    );
    ranks(
      "category-chart",
      data.categories,
      "stock",
      "un.",
      "Nenhuma categoria cadastrada.",
    );
  }
  async function refreshDashboard() {
    const button = el("refresh-dashboard");
    button.disabled = true;
    try {
      paintDashboard(await C.request("/api/admin/dashboard"));
    } catch (error) {
      C.toast(error.message);
    } finally {
      button.disabled = false;
    }
  }
  function preview() {
    el("photo-preview").innerHTML = C.photo({
      image_url: photoUrl,
      atlas,
      name: "Prévia da foto",
    });
  }
  function edit(id) {
    editorVersion++;
    form.reset();
    const p = products.find((p) => p.id === id);
    photoUrl = p?.image_url || "";
    atlas = p?.atlas ?? null;
    uploading = false;
    el("editor-title").textContent = p ? "Editar peça" : "Nova peça";
    el("product-id").value = p?.id || "";
    el("product-name").value = p?.name || "";
    el("category").value = p?.category || categories[0]?.name || "";
    el("color").value = p?.color || "";
    el("price").value = p
      ? (p.price_cents / 100).toFixed(2).replace(".", ",")
      : "";
    el("compare-price").value = p?.compare_price_cents
      ? (p.compare_price_cents / 100).toFixed(2).replace(".", ",")
      : "";
    el("description").value = p?.description || "";
    el("sizes").value = p?.sizes.join(", ") || "P, M, G";
    el("stock").value = p?.stock ?? 0;
    el("status").value = p?.status || "active";
    el("featured").checked = p?.featured || false;
    el("image-url").value = photoUrl.startsWith("/uploads/") ? "" : photoUrl;
    el("save-product").disabled = false;
    preview();
    dialog.showModal();
  }
  function cents(value, optional = false) {
    const input = value
      .trim()
      .replace(/^R\$\s*/, "")
      .replace(/\s/g, "");
    if (!input && optional) return null;
    let normalized = input;
    if (input.includes(",")) {
      normalized = input.replace(/\./g, "").replace(",", ".");
    }
    if (!/^\d+(\.\d{1,2})?$/.test(normalized))
      throw new Error("Informe o preço como 129,90.");
    const [whole, decimals = ""] = normalized.split(".");
    const result = Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
    if (!Number.isSafeInteger(result) || result <= 0)
      throw new Error("O preço precisa ser maior que zero.");
    return result;
  }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (uploading) return;
    const button = el("save-product");
    try {
      const typedUrl = el("image-url").value.trim();
      if (typedUrl && !C.safeImage(typedUrl))
        throw new Error("Use uma URL de imagem HTTP ou HTTPS.");
      if (typedUrl) photoUrl = typedUrl;
      const price = cents(el("price").value),
        previous = cents(el("compare-price").value, true);
      if (previous !== null && previous <= price)
        throw new Error("O preço anterior deve ser maior que o preço atual.");
      const payload = {
        name: el("product-name").value.trim(),
        category: el("category").value,
        color: el("color").value.trim(),
        description: el("description").value.trim(),
        price_cents: price,
        compare_price_cents: previous,
        sizes: el("sizes")
          .value.split(",")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean),
        stock: Number(el("stock").value),
        status: el("status").value,
        featured: el("featured").checked,
        image_url: photoUrl,
        atlas,
      };
      button.disabled = true;
      button.textContent = "Salvando…";
      const id = el("product-id").value;
      await C.request(
        "/api/admin/products" + (id ? "/" + id : ""),
        C.json(id ? "PUT" : "POST", payload),
      );
      dialog.close();
      await load();
      C.toast("Peça salva no catálogo.");
    } catch (error) {
      C.toast(error.message);
    } finally {
      button.disabled = false;
      button.textContent = "Salvar peça";
    }
  });
  el("photo-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      C.toast("A foto deve ter até 5 MB.");
      e.target.value = "";
      return;
    }
    const version = editorVersion;
    uploading = true;
    el("save-product").disabled = true;
    const prior = el("save-product").textContent;
    el("save-product").textContent = "Enviando foto…";
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await C.request("/api/admin/uploads", {
        method: "POST",
        body,
      });
      if (version !== editorVersion) return;
      photoUrl = result.url;
      atlas = null;
      el("image-url").value = "";
      preview();
      C.toast("Foto enviada. Salve a peça para publicar.");
    } catch (error) {
      C.toast(error.message);
    } finally {
      if (version === editorVersion) {
        uploading = false;
        el("save-product").disabled = false;
        el("save-product").textContent = prior;
        e.target.value = "";
      }
    }
  });
  el("image-url").addEventListener("change", (e) => {
    const value = e.target.value.trim();
    if (value && !C.safeImage(value)) {
      C.toast("Use uma URL de imagem HTTP ou HTTPS.");
      return;
    }
    photoUrl = value;
    atlas = null;
    preview();
  });
  el("remove-photo").addEventListener("click", () => {
    photoUrl = "";
    atlas = null;
    el("image-url").value = "";
    el("photo-file").value = "";
    preview();
  });
  el("new-product").addEventListener("click", () => edit());
  el("admin-search").addEventListener("input", paint);
  el("admin-filter").addEventListener("change", paint);
  el("admin-list").addEventListener("click", async (e) => {
    const editButton = e.target.closest("[data-edit]");
    if (editButton) {
      edit(editButton.dataset.edit);
      return;
    }
    const duplicate = e.target.closest("[data-copy]"),
      remove = e.target.closest("[data-delete]");
    if (!duplicate && !remove) return;
    const id = duplicate ? duplicate.dataset.copy : remove.dataset.delete;
    const product = products.find((p) => p.id === id);
    if (
      remove &&
      !confirm(
        `Excluir “${product.name}”? Esta ação remove a peça do catálogo.`,
      )
    )
      return;
    const button = duplicate || remove;
    button.disabled = true;
    try {
      await C.request(
        `/api/admin/products/${id}${duplicate ? "/duplicate" : ""}`,
        { method: duplicate ? "POST" : "DELETE" },
      );
      await load();
      C.toast(duplicate ? "Cópia criada como rascunho." : "Peça excluída.");
    } catch (error) {
      C.toast(error.message);
      button.disabled = false;
    }
  });
  el("settings-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = e.target.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      settings = await C.request(
        "/api/admin/settings",
        C.json("PUT", {
          brand_name: el("brand-name").value.trim(),
          whatsapp: el("whatsapp").value,
          instagram_enabled: el("instagram-enabled").checked,
          instagram_profile: el("instagram-profile").value,
          tiktok_enabled: el("tiktok-enabled").checked,
          tiktok_profile: el("tiktok-profile").value,
        }),
      );
      C.brand(settings);
      el("whatsapp").value = settings.whatsapp;
      el("instagram-profile").value = settings.instagram_profile;
      el("tiktok-profile").value = settings.tiktok_profile;
      el("setup-note").hidden = Boolean(settings.whatsapp);
      C.toast("Configurações salvas.");
    } catch (error) {
      C.toast(error.message);
    } finally {
      button.disabled = false;
    }
  });
  el("export").addEventListener("click", async () => {
    try {
      const data = await C.request("/api/admin/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cereja-catalogo.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      C.toast(
        "Catálogo exportado. Para guardar as fotos, copie também a pasta data.",
      );
    } catch (error) {
      C.toast(error.message);
    }
  });
  el("import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("Use um JSON de até 10 MB.");
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.products))
        throw new Error("O arquivo precisa ter uma lista products.");
      if (
        !confirm(
          `Substituir a coleção atual por ${data.products.length} peças do arquivo? Isso reinicia as visualizações das peças. Exporte a coleção antes, se quiser um backup.`,
        )
      )
        return;
      await C.request(
        "/api/admin/import",
        C.json("POST", {
          products: data.products,
          categories: Array.isArray(data.categories) ? data.categories : [],
        }),
      );
      await load();
      C.toast("Coleção importada.");
    } catch (error) {
      C.toast(
        error instanceof SyntaxError
          ? "O arquivo não contém um JSON válido."
          : error.message,
      );
    } finally {
      e.target.value = "";
    }
  });
  document
    .querySelectorAll("[data-screen]")
    .forEach((b) =>
      b.addEventListener("click", () => screen(b.dataset.screen)),
    );
  ["instagram", "tiktok"].forEach((network) =>
    el(network + "-enabled").addEventListener("change", socialFields),
  );
  el("refresh-dashboard").addEventListener("click", refreshDashboard);
  el("logout").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await C.request("/api/admin/logout", { method: "POST" });
      window.location.assign("/admin/login");
    } catch (error) {
      C.toast(error.message);
      button.disabled = false;
    }
  });
  el("category-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.target.querySelector("button");
    button.disabled = true;
    try {
      await C.request(
        "/api/admin/categories",
        C.json("POST", { name: el("new-category-name").value }),
      );
      el("new-category-name").value = "";
      await load();
      C.toast("Categoria adicionada.");
    } catch (error) {
      C.toast(error.message);
    } finally {
      button.disabled = false;
    }
  });
  el("category-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-category]");
    if (!button) return;
    const category = categories.find(
      (c) => c.id === button.dataset.deleteCategory,
    );
    if (!category) return;
    const options = categories.filter((c) => c.id !== category.id);
    el("delete-category-id").value = category.id;
    el("delete-category-text").textContent = category.product_count
      ? `${category.name} tem ${category.product_count} peças. Escolha outra categoria para elas.`
      : `Excluir a categoria ${category.name}? Ela não tem peças.`;
    el("replacement-field").hidden = !category.product_count;
    el("replacement-category").required = Boolean(category.product_count);
    el("replacement-category").innerHTML =
      '<option value="">Escolha uma categoria</option>' +
      options
        .map((c) => `<option value="${c.id}">${C.escape(c.name)}</option>`)
        .join("");
    if (category.product_count && !options.length) {
      C.toast(
        "Adicione outra categoria ou remova as peças antes de excluir esta.",
      );
      return;
    }
    el("delete-category-dialog").showModal();
  });
  el("delete-category-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.target.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      const id = el("delete-category-id").value,
        replacement = el("replacement-field").hidden
          ? ""
          : el("replacement-category").value;
      await C.request(
        "/api/admin/categories/" +
          id +
          (replacement
            ? "?replacement_id=" + encodeURIComponent(replacement)
            : ""),
        { method: "DELETE" },
      );
      el("delete-category-dialog").close();
      await load();
      C.toast("Categoria excluída.");
    } catch (error) {
      C.toast(error.message);
    } finally {
      button.disabled = false;
    }
  });
  document.querySelectorAll("label[role=button]").forEach((label) =>
    label.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el(label.htmlFor).click();
      }
    }),
  );
  load();
})();
