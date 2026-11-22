/* SparklePro Cleaning & Fumigation — clean sheet, quantities, WhatsApp hand-off */

(function () {
  "use strict";

  var CFG = {
    wa: "2348094157820",
    phone: "+2348094157820",
    items: {
      deep:   { name: "2\u20133 Bed Deep Clean",       price: 45000, kind: "flat" },
      duplex: { name: "Duplex Post-Construction",     price: 110000, kind: "flat" },
      fum:    { name: "Odourless Fumigation",         price: 35000, kind: "flat" },
      sofa:   { name: "Sofa & Mattress Steam",        price: 25000, kind: "qty", unit: "item",  min: 1, max: 6 },
      office: { name: "Weekly Office",                price: 60000, kind: "qty", unit: "week",  min: 1, max: 4 }
    }
  };

  var order = ["deep", "duplex", "fum", "sofa", "office"];

  var state = {
    on: { deep: false, duplex: false, fum: false, sofa: false, office: false },
    qty: { sofa: 1, office: 1 }
  };

  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  function naira(n) {
    return "\u20a6" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function lineTotal(id) {
    var it = CFG.items[id];
    if (!state.on[id]) return 0;
    return it.kind === "qty" ? it.price * state.qty[id] : it.price;
  }

  function total() {
    return order.reduce(function (sum, id) { return sum + lineTotal(id); }, 0);
  }

  function activeIds() {
    return order.filter(function (id) { return state.on[id]; });
  }

  function describe(id) {
    var it = CFG.items[id];
    if (it.kind === "qty") {
      var n = state.qty[id];
      return it.name + " (" + n + " " + it.unit + (n === 1 ? "" : "s") + ")";
    }
    return it.name;
  }

  function waHref() {
    var ids = activeIds();
    var body = "Hello SparklePro \u2014 I'd like a quote for:\n" +
      (ids.length ? ids.map(function (id) {
        var it = CFG.items[id];
        var detail = it.kind === "qty" ? " \u00d7 " + state.qty[id] + " " + it.unit + (state.qty[id] === 1 ? "" : "s") : "";
        return "- " + it.name + detail + " \u2014 " + naira(lineTotal(id));
      }).join("\n") : "- (nothing selected yet)") +
      "\nTotal: " + naira(total()) + "\nAddress: ";
    return "https://wa.me/" + CFG.wa + "?text=" + encodeURIComponent(body);
  }

  var popTimer = null;
  function pop(el) {
    if (!el) return;
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
    clearTimeout(popTimer);
    popTimer = setTimeout(function () { el.classList.remove("pop"); }, 240);
  }

  function rowHTML(id) {
    return "<li><span>" + describe(id) + "</span><b>" + naira(lineTotal(id)) + "</b></li>";
  }

  function render() {
    var sum = total();
    var ids = activeIds();

    /* list rows */
    $$("#index .iline").forEach(function (row) {
      var id = row.getAttribute("data-id");
      var on = !!state.on[id];
      row.classList.toggle("is-on", on);
      var btn = row.querySelector(".iline__add");
      if (btn) btn.textContent = on ? "Added" : "Add";
    });

    /* picks */
    $$("#picks .pick").forEach(function (pick) {
      var id = pick.getAttribute("data-id");
      var on = !!state.on[id];
      pick.classList.toggle("is-on", on);
      var head = pick.querySelector(".pick__head");
      if (head) head.setAttribute("aria-pressed", on ? "true" : "false");
      var qty = pick.querySelector("[data-qty]");
      if (qty) qty.hidden = !on;
      var line = pick.querySelector("[data-line]");
      if (line) line.textContent = naira(lineTotal(id));
    });

    var sofaQty = $("#sofaQty");
    if (sofaQty) sofaQty.textContent = state.qty.sofa;
    var officeQty = $("#officeQty");
    if (officeQty) officeQty.textContent = state.qty.office;

    /* sheet */
    var lines = $("#sheetLines");
    if (lines) {
      lines.innerHTML = ids.length
        ? ids.map(rowHTML).join("")
        : "<li class=\"empty\">No job picked yet.</li>";
    }
    var totalEl = $("#sheetTotal");
    if (totalEl && totalEl.textContent !== naira(sum)) {
      totalEl.textContent = naira(sum);
      pop(totalEl);
    }

    /* drawer + bar */
    var dList = $("#drawerList");
    if (dList) {
      dList.innerHTML = ids.length
        ? ids.map(rowHTML).join("")
        : "<li class=\"empty\">No job picked yet.</li>";
    }
    var dTotal = $("#drawerTotal");
    if (dTotal) dTotal.textContent = naira(sum);
    var bTotal = $("#barTotal");
    if (bTotal) bTotal.textContent = naira(sum);

    /* links */
    var href = waHref();
    ["#sheetCta", "#drawerWa", "#barWa"].forEach(function (sel) {
      var el = $(sel);
      if (el) el.setAttribute("href", href);
    });
  }

  function toggle(id) {
    if (!CFG.items[id]) return;
    state.on[id] = !state.on[id];
    render();
  }

  function step(id, dir) {
    var it = CFG.items[id];
    if (!it || it.kind !== "qty") return;
    state.qty[id] = Math.min(it.max, Math.max(it.min, state.qty[id] + dir));
    state.on[id] = true;
    render();
  }

  function scrollToSheet() {
    if (window.matchMedia("(max-width: 1080px)").matches) {
      var s = $(".sheetcard");
      if (s) s.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function openDrawer() {
    var d = $("#drawer");
    var s = $("#scrim");
    if (!d) return;
    if (s) { s.hidden = false; void s.offsetWidth; s.classList.add("is-open"); }
    d.classList.add("is-open");
    d.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    var d = $("#drawer");
    var s = $("#scrim");
    if (!d) return;
    d.classList.remove("is-open");
    d.setAttribute("aria-hidden", "true");
    if (s) {
      s.classList.remove("is-open");
      setTimeout(function () { s.hidden = true; }, 350);
    }
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    var el = e.target;

    var add = el.closest ? el.closest("[data-add]") : null;
    if (add) {
      state.on[add.getAttribute("data-add")] = true;
      render();
      scrollToSheet();
      return;
    }

    var t = el.closest ? el.closest("[data-toggle]") : null;
    if (t) { toggle(t.getAttribute("data-toggle")); return; }

    var st = el.closest ? el.closest("[data-step]") : null;
    if (st) {
      var v = st.getAttribute("data-step");
      var id = v.replace(/-(up|down)$/, "");
      step(id, v.indexOf("up") > -1 ? 1 : -1);
      return;
    }

    if (el.closest && el.closest("#barOpen")) { openDrawer(); return; }
    if (el.closest && el.closest("#drawerClose")) { closeDrawer(); return; }
    if (el.closest && el.closest("#scrim")) { closeDrawer(); return; }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDrawer();
  });

  var boot = document.querySelector(".boot");
  if (boot) {
    setTimeout(function () {
      if (boot && boot.parentNode) boot.parentNode.removeChild(boot);
    }, 2500);
  }

  render();
})();
