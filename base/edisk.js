/* Local eDisk stub. Silent background writes only.
   TODO(server): replace write() with a POST to a first-party server
   endpoint. Do not store credentials here. Do not write from the
   browser to any back-end store. A real hookup needs a typed yes. */
(function (G) {
  "use strict";

  var STORAGE_KEY = "ckw-edisk-stub-v1";
  var queue = [];

  function loadStub() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function persist(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      /* private mode or quota: keep the in-memory queue only */
    }
  }

  function write(record) {
    if (!record || typeof record !== "object") return false;
    queue.push(record);
    var all = loadStub();
    all.push(record);
    persist(all);
    return true;
  }

  function exportJson() {
    return JSON.stringify(loadStub(), null, 2);
  }

  function download() {
    var blob = new Blob([exportJson()], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "ckw-edisk-stub.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  G.edisk = {
    write: write,
    exportJson: exportJson,
    download: download,
    STORAGE_KEY: STORAGE_KEY
  };
})(window);
