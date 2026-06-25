(function () {
  function applyPageClass() {
    var path = window.location.pathname.replace(/\/+$/, "");
    var page = "home";
    if (path.endsWith("/data_eda")) page = "data-eda";
    else if (path.endsWith("/experiments")) page = "experiments";
    else if (path.endsWith("/project_story")) page = "project-story";
    else if (path.endsWith("/task_metric")) page = "task-metric";
    else if (path.endsWith("/validation")) page = "validation";
    else if (path.endsWith("/methods")) page = "methods";
    else if (path.endsWith("/engineering")) page = "engineering";

    document.body.classList.remove(
      "otto-page-home",
      "otto-page-data-eda",
      "otto-page-experiments",
      "otto-page-project-story",
      "otto-page-task-metric",
      "otto-page-validation",
      "otto-page-methods",
      "otto-page-engineering",
    );
    document.body.classList.add("otto-ui", "otto-page-" + page);
  }

  if (typeof document$ !== "undefined") {
    document$.subscribe(applyPageClass);
  } else {
    document.addEventListener("DOMContentLoaded", applyPageClass);
  }
})();
