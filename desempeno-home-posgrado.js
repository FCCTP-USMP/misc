document.addEventListener("DOMContentLoaded", () => {
  if (Date.now() < new Date("2026-09-26T07:30:00-05:00").getTime()) {
    return;
  }

  const userId = window.M?.cfg?.userId;
  const token = window.M?.cfg?.jwttoken;
  if (!userId || Number(userId) <= 0 || !token) {
    return;
  }
  const IMG_URL =
    "https://apps.fcctp.edu.pe/encuestas/images/2026/desempeno_v2.png";
  const APP_URL = "https://apps.fcctp.edu.pe/encuestas";

  const redirectTo = encodeURIComponent(window.location.href);
  const COOLDOWN_MINUTES = 30;
  const templateId = 44;
  const storageKey = `desempeno_home_posgrado_${userId}_cooldown`;
  const cooldownUntil = localStorage.getItem(storageKey);
  if (cooldownUntil && Date.now() < Number(cooldownUntil)) {
    return;
  }

  let currentEncuestas = [];
  let countdownInterval = null;
  let forced = false;

  const fabHtml = `<button id="encuestacursos-fab" title="Encuestas docentes">
    <span style="font-size:22px;line-height:1;">📋</span>
  </button>`;
  document.body.insertAdjacentHTML("beforeend", fabHtml);

  const style = document.createElement("style");
  style.textContent = `
    @keyframes encuestacursos-pulse {
      0% { box-shadow: 0 0 0 0 rgba(180, 26, 19, 0.6); }
      70% { box-shadow: 0 0 0 14px rgba(180, 26, 19, 0); }
      100% { box-shadow: 0 0 0 0 rgba(180, 26, 19, 0); }
    }
    #encuestacursos-fab {
      position: fixed;
      bottom: 90px;
      right: 32px;
      z-index: 99999;
      height: 54px;
      width: 54px;
      border-radius: 50%;
      background: linear-gradient(135deg, #b41a13 0%, #8c130d 100%);
      color: #fff;
      border: none;
      outline: none;
      box-shadow: 0 4px 14px rgba(180, 26, 19, 0.35);
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      animation: encuestacursos-pulse 2.2s infinite;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    #encuestacursos-fab:hover {
      transform: translateY(-2px) scale(1.04);
      box-shadow: 0 6px 18px rgba(180, 26, 19, 0.5);
    }
    #encuestacursos-fab::after {
      content: "Completa estas encuestas";
      position: absolute;
      right: 66px;
      top: 50%;
      transform: translateY(-50%);
      background: #1e293b;
      color: #fff;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity .25s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    #encuestacursos-fab:hover::after {
      opacity: 1;
    }
    .encuestacursos-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background-color: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .encuestacursos-modal {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
      border-top: 5px solid #b41a13;
      width: 92%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      padding: 24px 24px 20px;
    }
    .encuestacursos-close-btn {
      position: absolute;
      top: 14px;
      right: 16px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: #f1f5f9;
      color: #64748b;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s, color 0.2s;
    }
    .encuestacursos-close-btn:hover {
      background: #fee2e2;
      color: #b41a13;
    }
    .encuestacursos-btn-primary {
      background: #b41a13;
      border: 1px solid #b41a13;
      color: #fff !important;
      font-weight: 500;
      border-radius: 6px;
      padding: 5px 14px;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s ease;
      text-decoration: none !important;
      box-shadow: 0 2px 5px rgba(180, 26, 19, 0.25);
    }
    .encuestacursos-btn-primary:hover {
      background: #94150f;
      border-color: #94150f;
      color: #fff !important;
      box-shadow: 0 4px 10px rgba(180, 26, 19, 0.35);
      transform: translateY(-1px);
    }
    .encuestacursos-badge-completed {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      font-weight: 500;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 20px;
    }
    .encuestacursos-section-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .encuestacursos-section-title::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 16px;
      background: #b41a13;
      border-radius: 2px;
    }
    .encuestacursos-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px !important;
      margin-bottom: 8px;
      padding: 10px 14px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .encuestacursos-item:hover {
      border-color: #cbd5e1;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    }
    .encuestacursos-item-pending {
      border-left: 3px solid #b41a13;
    }
    .encuestacursos-item-completed {
      background: #f8fafc;
      border-left: 3px solid #10b981;
      opacity: 0.85;
    }
    .encuestacursos-alert-timer {
      background: #fff5f5;
      border: 1px solid #fed7d7;
      color: #9b1c1c;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 14px;
    }
    .encuestacursos-alert-expired {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b41a13;
      font-weight: 600;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);

  const fetchEncuestas = async () => {
    return fetch(`${APP_URL}/api/encuestas/find`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        template_id: templateId,
      }),
    })
      .then((r) => r.json())
      .then((data) => data.encuestas);
  };

  const groupBySection = (encuestas) => {
    return encuestas.reduce((acc, e) => {
      const section = e.extra.curso_info.nom_seccion_mooodle;
      if (!acc[section]) {
        acc[section] = {
          desc_curso: e.extra.curso_info.desc_curso,
          pending: [],
          completed: [],
        };
      }
      if (e.completed_at) {
        acc[section].completed.push(e);
      } else {
        acc[section].pending.push(e);
      }
      return acc;
    }, {});
  };

  const formatCountdown = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getPending = () => currentEncuestas.filter((e) => !e.completed_at);

  const getLastCompleted = () => {
    const completed = currentEncuestas.filter((e) => e.completed_at);
    if (!completed.length) return null;
    return completed.sort(
      (a, b) => new Date(b.completed_at) - new Date(a.completed_at),
    )[0];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stopCountdown = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  };

  const closePopup = () => {
    const overlay = document.querySelector(".encuestacursos-overlay");
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = "";
    }
    const pageWrapper = document.getElementById("page-wrapper");
    if (pageWrapper) {
      pageWrapper.style.overflow = "";
      pageWrapper.style.height = "";
    }
    stopCountdown();
  };

  const buildSectionHtml = (group, redirectTo) => {
    const pendingItems = group.pending
      .map(
        (e) => `
      <li class="list-group-item encuestacursos-item encuestacursos-item-pending d-flex justify-content-between align-items-center">
        <span style="font-weight: 500; color: #1e293b;">${e.extra.docente_info.docente}</span>
        <a href="${e.url}?redirect_to=${redirectTo}" class="encuestacursos-btn-primary">
          <span>Ir a encuesta</span>
          <span>&rarr;</span>
        </a>
      </li>
    `,
      )
      .join("");
    const completedItems = group.completed
      .map(
        (e) => `
      <li class="list-group-item encuestacursos-item encuestacursos-item-completed d-flex justify-content-between align-items-center">
        <span class="text-muted">${e.extra.docente_info.docente}</span>
        <span class="encuestacursos-badge-completed">&#10003; Completada</span>
      </li>
    `,
      )
      .join("");
    return pendingItems + completedItems;
  };

  const isForced = (lastCompletedAt) => {
    if (!lastCompletedAt) return false;
    const cooldownEnd =
      new Date(lastCompletedAt).getTime() + COOLDOWN_MINUTES * 60 * 1000;
    return Date.now() >= cooldownEnd;
  };

  const createPopup = (encuestas) => {
    const pageWrapper = document.getElementById("page-wrapper");
    if (pageWrapper) {
      pageWrapper.style.cssText +=
        "overflow: hidden !important; height: 100vh !important;";
    }

    const overlay = document.createElement("div");
    overlay.className = "encuestacursos-overlay";

    const grouped = groupBySection(encuestas);
    const sectionKeys = Object.keys(grouped);

    const sectionsHtml = sectionKeys
      .map((sectionKey) => {
        const group = grouped[sectionKey];
        const splittedSection =
          (sectionKey.split(">")[1] ?? "").split("_")[0] ?? "";
        return `
        <div class="mb-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h6 class="encuestacursos-section-title mb-0">${group.desc_curso}</h6>
            ${
              splittedSection
                ? `<span class="badge" style="background:#f1f5f9; color:#475569; font-size:11px; padding:4px 8px; border-radius:12px;">Sec. ${splittedSection}</span>`
                : ""
            }
          </div>
          <ul class="list-group list-group-flush">${buildSectionHtml(group, redirectTo)}</ul>
        </div>
      `;
      })
      .join("");

    const lastCompleted = getLastCompleted();
    const lastCompletedAt = lastCompleted?.completed_at;
    const pending = getPending();

    if (!lastCompletedAt && pending.length > 0) {
      forced = true;
    } else {
      forced = isForced(lastCompletedAt);
    }

    const countdownId = "countdown-timer";
    const countdownHtml = forced
      ? `<div class="encuestacursos-alert-expired mb-3 text-center">⚠️ El tiempo ha expirado. Debes completar las encuestas.</div>`
      : pending.length > 0
        ? `<div class="encuestacursos-alert-timer mb-3 d-flex align-items-center justify-content-center gap-2">
            <span>⏳ Puedes ocultar este modal durante:</span>
            <strong id="${countdownId}" style="color:#b41a13; font-family:monospace; font-size:15px;">--:--</strong>
          </div>`
        : "";

    const lastCompletedHtml = lastCompleted
      ? `<div class="alert alert-light border mb-3 py-1 px-2 text-muted small" style="border-radius:6px;">Última respuesta: ${formatDate(lastCompleted.completed_at)}</div>`
      : "";

    const closeBtn = forced
      ? ""
      : `<button class="encuestacursos-close-btn" id="close-btn" title="Cerrar">&times;</button>`;

    overlay.innerHTML = `
      <div class="encuestacursos-modal text-center">
        ${closeBtn}
        <img src="${IMG_URL}" style="width: 100%; max-width: 520px; border-radius: 8px; margin: 0 auto;" class="mb-3" />
        <p class="text-muted small text-justify mb-3" style="line-height: 1.5;">
          Tu opinión ayuda a mejorar la calidad de la enseñanza en tu facultad. Completa la encuesta de cada curso: es anónima y solo te tomará unos minutos. Al finalizar cada una, tendrás 30 minutos para seguir navegando en el aula virtual. ¡Complétalas todas antes de continuar!
        </p>
        ${countdownHtml}
        ${lastCompletedHtml}
        <div class="text-left">${sectionsHtml}</div>
      </div>
    `;

    document.body.appendChild(overlay);

    if (!forced) {
      document.getElementById("close-btn")?.addEventListener("click", () => {
        closePopup();
      });
    }

    if (!forced && lastCompletedAt) {
      startCountdown(lastCompletedAt);
    }
  };

  const startCountdown = (lastCompletedAt) => {
    stopCountdown();

    const updateCountdown = () => {
      const timerEl = document.getElementById("countdown-timer");
      if (!timerEl) return;

      if (!lastCompletedAt) {
        timerEl.textContent = "--:--";
        return;
      }

      const cooldownEnd =
        new Date(lastCompletedAt).getTime() + COOLDOWN_MINUTES * 60 * 1000;
      const remaining = cooldownEnd - Date.now();

      if (remaining <= 0) {
        stopCountdown();
        timerEl.textContent = "00:00";
        const alertEl = document.querySelector(
          ".encuestacursos-overlay .encuestacursos-alert-timer",
        );
        if (alertEl) {
          alertEl.className = "encuestacursos-alert-expired mb-3 text-center";
          alertEl.innerHTML =
            "⚠️ El tiempo ha expirado. Debes completar las encuestas.";
        }
        return;
      }

      timerEl.textContent = formatCountdown(remaining);
    };

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  };

  const listsEncuestas = (encuestas) => {
    const container = document.getElementById("tool-encuestacursos-encuestas");
    if (!container) return;

    const grouped = groupBySection(encuestas);
    const sectionKeys = Object.keys(grouped);

    const sectionsHtml = sectionKeys
      .map((sectionKey) => {
        const group = grouped[sectionKey];
        return `
          <div class="mb-3">
            <h6 class="encuestacursos-section-title mb-1">Sección: ${sectionKey}</h6>
            <p class="mb-2 text-muted small">${group.desc_curso}</p>
            <ul class="list-group list-group-flush">${buildSectionHtml(group, redirectTo)}</ul>
          </div>
        `;
      })
      .join("");

    container.innerHTML = sectionsHtml;
  };

  const checkEncuesta = async () => {
    let encuestas;
    try {
      encuestas = await fetchEncuestas();
    } catch (err) {
      localStorage.setItem(storageKey, String(Date.now() + 60 * 60 * 1000));
      console.error(err);
      return;
    }

    if (!encuestas || !encuestas.length) {
      localStorage.setItem(storageKey, String(Date.now() + 60 * 60 * 1000));
      return;
    }

    currentEncuestas = encuestas;
    listsEncuestas(currentEncuestas);

    const pending = getPending();
    if (!pending.length) return;

    const fab = document.getElementById("encuestacursos-fab");
    if (fab) {
      fab.style.display = "flex";
    }

    const lastCompleted = getLastCompleted();
    const lastCompletedAt = lastCompleted?.completed_at;
    const forcedByTime = !lastCompletedAt || isForced(lastCompletedAt);

    if (forcedByTime) {
      createPopup(currentEncuestas);
    }
  };

  document
    .getElementById("encuestacursos-fab")
    ?.addEventListener("click", () => {
      if (currentEncuestas.length) {
        createPopup(currentEncuestas);
      }
    });

  checkEncuesta();
});
