document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorMsg = document.getElementById("loginError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const contrasena = document.getElementById("contrasena").value;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        window.location.href = result.redirect;
      } else {
        errorMsg.textContent = result.message || "Error al iniciar sesión";
      }
    } catch (error) {
      errorMsg.textContent = "Error de conexión con el servidor";
      console.error("Login error:", error);
    }
  });
});