(function () {
  var q = location.search || "";
  var h = location.hash || "";
  var dest = "/" + q + h;
  var a = document.getElementById("ckw-continue");
  if (a) a.setAttribute("href", dest);
  location.replace(dest);
})();
