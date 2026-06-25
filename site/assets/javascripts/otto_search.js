(function () {
  var state = {
    loaded: false,
    loading: null,
    docs: [],
    nodes: null,
    keyBound: false,
  };

  function readConfig() {
    var element = document.getElementById("__config");
    if (!element) return { base: "." };
    try {
      return JSON.parse(element.textContent || "{}");
    } catch (error) {
      return { base: "." };
    }
  }

  function stripHtml(value) {
    return (value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeLocation(base, location) {
    var prefix = (base || ".").replace(/\/$/, "");
    var cleanLocation = (location || "").replace(/^\/+/, "");
    if (!prefix || prefix === ".") {
      return cleanLocation || ".";
    }
    return cleanLocation ? prefix + "/" + cleanLocation : prefix;
  }

  function ensureIndexLoaded() {
    if (state.loaded) return Promise.resolve(state.docs);
    if (state.loading) return state.loading;

    var config = readConfig();
    var indexUrl = new URL("search/search_index.json", window.location.href);
    if (config.base && config.base !== ".") {
      indexUrl = new URL(config.base.replace(/\/$/, "") + "/search/search_index.json", window.location.href);
    }

    state.loading = fetch(indexUrl.toString())
      .then(function (response) {
        if (!response.ok) throw new Error("search index unavailable");
        return response.json();
      })
      .then(function (payload) {
        var base = config.base || ".";
        state.docs = (payload.docs || []).map(function (doc) {
          return {
            location: normalizeLocation(base, doc.location),
            title: stripHtml(doc.title),
            text: stripHtml(doc.text),
          };
        });
        state.loaded = true;
        return state.docs;
      })
      .catch(function () {
        state.docs = [];
        state.loaded = true;
        return state.docs;
      });

    return state.loading;
  }

  function escapeHtml(value) {
    return (value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildSnippet(text, query) {
    if (!text) return "该页面以标题命中为主。";

    var source = text;
    var lowerSource = source.toLowerCase();
    var lowerQuery = query.toLowerCase();
    var index = lowerSource.indexOf(lowerQuery);
    if (index < 0) return source.slice(0, 120) + (source.length > 120 ? "..." : "");

    var start = Math.max(0, index - 36);
    var end = Math.min(source.length, index + query.length + 72);
    var prefix = start > 0 ? "..." : "";
    var suffix = end < source.length ? "..." : "";
    return prefix + source.slice(start, end) + suffix;
  }

  function renderResults(results, query, nodes) {
    if (!query) {
      nodes.meta.textContent = "输入中文或英文关键词开始搜索。";
      nodes.results.innerHTML = "";
      return;
    }

    if (!results.length) {
      nodes.meta.textContent = "没有找到结果。";
      nodes.results.innerHTML = "";
      return;
    }

    nodes.meta.textContent = "找到 " + results.length + " 个结果。";
    nodes.results.innerHTML = results
      .slice(0, 12)
      .map(function (item) {
        var title = escapeHtml(item.title || "未命名页面");
        var snippet = escapeHtml(buildSnippet(item.text, query));
        var location = escapeHtml(item.location);
        return (
          '<a class="otto-search-result" href="' +
          location +
          '">' +
          '<strong class="otto-search-result__title">' +
          title +
          "</strong>" +
          '<p class="otto-search-result__snippet">' +
          snippet +
          "</p>" +
          "</a>"
        );
      })
      .join("");
  }

  function searchDocs(query, docs) {
    var keyword = query.trim().toLowerCase();
    if (!keyword) return [];

    return docs
      .map(function (doc) {
        var title = doc.title || "";
        var text = doc.text || "";
        var titleLower = title.toLowerCase();
        var textLower = text.toLowerCase();
        var titleIndex = titleLower.indexOf(keyword);
        var textIndex = textLower.indexOf(keyword);
        if (titleIndex < 0 && textIndex < 0) return null;
        return {
          title: title,
          text: text,
          location: doc.location,
          score: (titleIndex >= 0 ? 1000 - titleIndex : 0) + (textIndex >= 0 ? 200 - Math.min(textIndex, 200) : 0),
        };
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return b.score - a.score;
      });
  }

  function closeModal(nodes) {
    if (!nodes || !nodes.modal) return;
    nodes.modal.hidden = true;
    document.body.classList.remove("otto-search-open");
  }

  function openModal(nodes) {
    if (!nodes || !nodes.modal) return;
    nodes.modal.hidden = false;
    document.body.classList.add("otto-search-open");
    window.setTimeout(function () {
      nodes.input.focus();
      nodes.input.select();
    }, 20);
    ensureIndexLoaded().then(function () {
      if (!nodes.input.value.trim()) {
        nodes.meta.textContent = "输入中文或英文关键词开始搜索。";
      }
    });
  }

  function bindSearch() {
    var modal = document.querySelector("[data-otto-search-modal]");
    var input = document.querySelector("[data-otto-search-input]");
    var meta = document.querySelector("[data-otto-search-meta]");
    var results = document.querySelector("[data-otto-search-results]");
    var openers = Array.prototype.slice.call(document.querySelectorAll("[data-otto-search-open]"));
    var closers = Array.prototype.slice.call(document.querySelectorAll("[data-otto-search-close]"));

    if (!modal || !input || !meta || !results || !openers.length) return;
    if (modal.dataset.ottoBound === "true") return;

    modal.dataset.ottoBound = "true";

    var nodes = {
      modal: modal,
      input: input,
      meta: meta,
      results: results,
    };
    state.nodes = nodes;

    openers.forEach(function (button) {
      button.addEventListener("click", function () {
        openModal(nodes);
      });
    });

    closers.forEach(function (button) {
      button.addEventListener("click", function () {
        closeModal(nodes);
      });
    });

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal(nodes);
    });

    input.addEventListener("input", function () {
      ensureIndexLoaded().then(function (docs) {
        renderResults(searchDocs(input.value, docs), input.value, nodes);
      });
    });

    if (!state.keyBound) {
      document.addEventListener("keydown", function (event) {
        var current = state.nodes;
        var typingInField =
          document.activeElement &&
          /^(input|textarea)$/i.test(document.activeElement.tagName);

        if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (!typingInField && event.key === "/")) {
          event.preventDefault();
          openModal(current);
        }

        if (event.key === "Escape" && current && !current.modal.hidden) {
          event.preventDefault();
          closeModal(current);
        }
      });
      state.keyBound = true;
    }
  }

  if (typeof document$ !== "undefined") {
    document$.subscribe(bindSearch);
  } else {
    document.addEventListener("DOMContentLoaded", bindSearch);
  }
})();
