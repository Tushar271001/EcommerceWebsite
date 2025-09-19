 function loadComponent(id, file) {
      fetch(file).then(res => res.text()).then(data => {
        document.getElementById(id).innerHTML = data;
        // refresh UI after navbar/footer load
        refreshAccountUI();
        updateCartBadge();
      });
    }
    loadComponent("navbar", "/navbar.html");
    loadComponent("footer", "/footer.html");

    document.addEventListener("DOMContentLoaded", () => {
      refreshAccountUI();
      updateCartBadge();
      loadCart();
    });