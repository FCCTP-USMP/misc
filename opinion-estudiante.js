document.addEventListener("DOMContentLoaded", () => {
  if (Date.now() < new Date("2026-09-25T07:30:00-05:00").getTime()) {
    return;
  }

  const userId = window.M?.cfg?.userId;
  const token = window.M?.cfg?.jwttoken;
  if (!userId || Number(userId) <= 0 || !token) {
    return;
  }

  const templateId = 39;
  const storageKey = `opinion_estudiante_${userId}_cooldown`;
  const cooldownUntil = localStorage.getItem(storageKey);
  if (cooldownUntil && Date.now() < Number(cooldownUntil)) {
    return;
  }

  if (!document.querySelector('link[href*="basiclightbox"]')) {
    document.head.appendChild(
      Object.assign(document.createElement("link"), {
        rel: "stylesheet",
        href: "//unpkg.com/basiclightbox@5.0.4/dist/basicLightbox.min.css",
      }),
    );
    document.head.appendChild(
      Object.assign(document.createElement("style"), {
        innerHTML: ".basicLightbox { z-index: 9999!important; }",
      }),
    );
  }

  const load = (src) => new Promise((r) => requirejs([src], r));

  Promise.all([
    load("//unpkg.com/basiclightbox@5.0.4/dist/basicLightbox.min.js"),
    load("//unpkg.com/axios@1.9.0/dist/axios.min.js"),
  ])
    .then(([basicLightbox, axios]) => {
      const launchModal = (url) => {
        basicLightbox
          .create(
            `<div class="text-center"><a href="${url}"><img src="//apps.fcctp.edu.pe/encuestas/images/2026/opinion-estudiantes-posgrado.png" style="max-height:80vh"></a></div>`,
            { closable: false },
          )
          .show();
      };

      axios
        .post(
          "https://apps.fcctp.edu.pe/encuestas/api/encuestas/find",
          {
            template_id: templateId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        .then((r) => {
          const encuestas = r.data.encuestas;
          if (!encuestas || encuestas.length === 0) {
            localStorage.setItem(
              storageKey,
              String(Date.now() + 60 * 60 * 1000),
            );
            return;
          }

          const encuesta = encuestas[0];
          if (encuesta && !encuesta.completed_at) {
            launchModal(
              encuesta.url +
                "?redirect_to=" +
                encodeURIComponent(window.M.cfg.wwwroot),
            );
          }
        })
        .catch((error) => {
          localStorage.setItem(
            storageKey,
            String(Date.now() + 60 * 60 * 1000),
          );
          console.error(error);
        });
    })
    .catch(console.error);
});
