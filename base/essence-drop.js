(function () {
  var btn = document.getElementById("essence-tracks-btn");
  var drop = document.getElementById("essence-drop");
  var logout = document.getElementById("logout-btn");
  if (!btn || !drop) return;
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = drop.hidden;
    drop.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (logout) logout.hidden = !(open && logout.dataset.signedin === "1");
  });
  document.addEventListener("click", function () {
    drop.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    if (logout) logout.hidden = true;
  });
  drop.addEventListener("click", function (e) { e.stopPropagation(); });
})();
