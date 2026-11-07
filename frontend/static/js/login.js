(() => {
  const C = window.Cereja,
    form = document.getElementById("login-form"),
    button = document.getElementById("login-submit"),
    error = document.getElementById("login-error");
  C.request("/api/settings")
    .then(C.brand)
    .catch(() => {});
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;
    button.disabled = true;
    button.textContent = "Entrando…";
    try {
      await C.request(
        "/api/admin/login",
        C.json("POST", {
          password: document.getElementById("admin-password").value,
        }),
      );
      window.location.assign("/admin");
    } catch (reason) {
      error.textContent = reason.message;
      error.hidden = false;
      document.getElementById("admin-password").value = "";
      document.getElementById("admin-password").focus();
    } finally {
      button.disabled = false;
      button.textContent = "Entrar";
    }
  });
})();
