/**
 * Módulo de Encuestas de Desempeño Docente - Moodle
 * Vanilla JS (ES6+) para navegador en un único archivo.
 * Arquitectura modular aplicando principios SOLID.
 */
(() => {
  "use strict";

  // ==========================================================================
  // 1. CONFIGURACIÓN (Inmutable y centralizada)
  // ==========================================================================
  const CONFIG = {
    templateId: 41,
    startDate: "2026-09-25T07:30:00-05:00",
    cooldownMinutes: 30,
    errorCooldownHours: 1,
    appUrl: "https://apps.fcctp.edu.pe/encuestas",
    imgUrl: "https://apps.fcctp.edu.pe/encuestas/images/2026/desempeno_v2.png",
    storagePrefix: "desempeno_home",
    selectors: {
      fabId: "encuestacursos-fab",
      overlayClass: "encuestacursos-overlay",
      pageWrapperId: "page-wrapper",
      moodleBlockContainerId: "tool-encuestacursos-encuestas",
    },
  };

  // ==========================================================================
  // 2. ESTILOS CSS (Inyección desacoplada de la lógica de negocio)
  // ==========================================================================
  class StyleInjector {
    static inject() {
      if (document.getElementById("encuestacursos-styles")) return;

      const style = document.createElement("style");
      style.id = "encuestacursos-styles";
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
          content: attr(data-tooltip);
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
        #encuestacursos-fab:not([data-tooltip])::after {
          content: "Completa estas encuestas";
        }
        #encuestacursos-fab.completed::after {
          content: "Encuestas completadas";
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
    }
  }

  // ==========================================================================
  // 3. PERSISTENCIA (SRP: Manejo de cooldowns en LocalStorage)
  // ==========================================================================
  class CooldownStorage {
    constructor(userId, prefix = "desempeno_home") {
      this.storageKey = `${prefix}_${userId}_v2_cooldown`;
    }

    isCoolingDown() {
      const cooldownUntil = localStorage.getItem(this.storageKey);
      return Boolean(cooldownUntil && Date.now() < Number(cooldownUntil));
    }

    setCooldownHours(hours = 1) {
      const expiration = Date.now() + hours * 60 * 60 * 1000;
      localStorage.setItem(this.storageKey, String(expiration));
    }
  }

  // ==========================================================================
  // 4. API CLIENT (SRP: Encapsula la comunicación de red)
  // ==========================================================================
  class SurveyApiClient {
    constructor(appUrl, token) {
      this.appUrl = appUrl;
      this.token = token;
    }

    async fetchSurveys(templateId) {
      const response = await fetch(`${this.appUrl}/api/encuestas/find`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ template_id: templateId }),
      });

      if (!response.ok) {
        const error = new Error(
          response.statusText || `HTTP ${response.status}`,
        );
        error.status = response.status;
        error.statusCode = response.status;
        throw error;
      }

      const data = await response.json();
      return Array.isArray(data.encuestas) ? data.encuestas : [];
    }
  }

  // ==========================================================================
  // 5. LÓGICA DE NEGOCIO / DOMINIO (SRP: Operaciones puras con encuestas)
  // ==========================================================================
  class SurveyDomain {
    static getPending(encuestas) {
      return encuestas.filter((e) => !e.completed_at);
    }

    static getLastCompleted(encuestas) {
      const completed = encuestas.filter((e) => e.completed_at);
      if (!completed.length) return null;
      return completed.sort(
        (a, b) =>
          new Date(b.completed_at).getTime() -
          new Date(a.completed_at).getTime(),
      )[0];
    }

    static isForcedExpired(lastCompletedAt, cooldownMinutes) {
      if (!lastCompletedAt) return false;
      const cooldownEnd =
        new Date(lastCompletedAt).getTime() + cooldownMinutes * 60 * 1000;
      return Date.now() >= cooldownEnd;
    }

    static groupBySection(encuestas) {
      return encuestas.reduce((acc, e) => {
        const section = e.extra?.curso_info?.nom_seccion_mooodle || "General";
        if (!acc[section]) {
          acc[section] = {
            desc_curso: e.extra?.curso_info?.desc_curso || "",
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
    }

    static formatDate(dateStr) {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toLocaleString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    static formatCountdown(ms) {
      const totalSeconds = Math.max(0, Math.floor(ms / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  // ==========================================================================
  // 6. RENDERIZADOR DE HTML (SRP: Generación de marcado)
  // ==========================================================================
  class SurveyViewRenderer {
    static renderSections(encuestas, redirectTo, isMoodleBlock = false) {
      const grouped = SurveyDomain.groupBySection(encuestas);
      const sectionKeys = Object.keys(grouped);

      return sectionKeys
        .map((sectionKey) => {
          const group = grouped[sectionKey];
          const splittedSection =
            (sectionKey.split(">")[1] ?? "").split("_")[0] ?? "";

          const headerHtml = isMoodleBlock
            ? `<h6 class="encuestacursos-section-title mb-1">Sección: ${sectionKey}</h6>
               <p class="mb-2 text-muted small">${group.desc_curso}</p>`
            : `<div class="d-flex align-items-center justify-content-between mb-2">
                 <h6 class="encuestacursos-section-title mb-0">${group.desc_curso}</h6>
                 ${splittedSection ? `<span class="badge" style="background:#f1f5f9; color:#475569; font-size:11px; padding:4px 8px; border-radius:12px;">Sec. ${splittedSection}</span>` : ""}
               </div>`;

          return `
            <div class="mb-3">
              ${headerHtml}
              <ul class="list-group list-group-flush">${this.renderSectionItems(group, redirectTo)}</ul>
            </div>
          `;
        })
        .join("");
    }

    static renderSectionItems(group, redirectTo) {
      const pendingItems = group.pending
        .map(
          (e) => `
        <li class="list-group-item encuestacursos-item encuestacursos-item-pending d-flex justify-content-between align-items-center">
          <span style="font-weight: 500; color: #1e293b;">${e.extra?.docente_info?.docente || "Docente"}</span>
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
          <span class="text-muted">${e.extra?.docente_info?.docente || "Docente"}</span>
          <span class="encuestacursos-badge-completed">&#10003; Completada</span>
        </li>
      `,
        )
        .join("");

      return pendingItems + completedItems;
    }
  }

  // ==========================================================================
  // 7. TEMPORIZADOR DE CUENTA REGRESIVA (SRP: Manejo de intervalos)
  // ==========================================================================
  class CountdownTimer {
    constructor(cooldownMinutes) {
      this.durationMs = cooldownMinutes * 60 * 1000;
      this.intervalId = null;
    }

    start(lastCompletedAt, onTick, onExpired) {
      this.stop();
      if (!lastCompletedAt) return;

      const cooldownEnd = new Date(lastCompletedAt).getTime() + this.durationMs;

      const update = () => {
        const remaining = cooldownEnd - Date.now();
        if (remaining <= 0) {
          this.stop();
          onExpired();
          return;
        }
        onTick(SurveyDomain.formatCountdown(remaining));
      };

      update();
      this.intervalId = setInterval(update, 1000);
    }

    stop() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  }

  // ==========================================================================
  // 8. BOTÓN FLOTANTE (FAB) (SRP: Gestión del botón y sus tooltips)
  // ==========================================================================
  class SurveyFab {
    constructor(elementId, onClick) {
      this.elementId = elementId;
      this.onClick = onClick;
      this.el = this.initElement();
    }

    initElement() {
      let fab = document.getElementById(this.elementId);
      if (!fab) {
        const fabHtml = `
          <button id="${this.elementId}" title="Encuestas docentes" data-tooltip="Completa estas encuestas">
            <span style="font-size:22px;line-height:1;">📋</span>
          </button>
        `;
        document.body.insertAdjacentHTML("beforeend", fabHtml);
        fab = document.getElementById(this.elementId);
      }
      fab.addEventListener("click", this.onClick);
      return fab;
    }

    show(allCompleted = false) {
      if (!this.el) return;
      this.el.style.display = "flex";

      if (allCompleted) {
        this.el.setAttribute("data-tooltip", "Encuestas completadas");
        this.el.title = "Encuestas completadas";
        this.el.classList.add("completed");
      } else {
        this.el.setAttribute("data-tooltip", "Completa estas encuestas");
        this.el.title = "Completa estas encuestas";
        this.el.classList.remove("completed");
      }
    }
  }

  // ==========================================================================
  // 9. MODAL POPUP (SRP: Control de vista del diálogo y bloqueo de scroll)
  // ==========================================================================
  class SurveyModal {
    constructor(config, timer) {
      this.config = config;
      this.timer = timer;
      this.redirectTo = encodeURIComponent(window.location.href);
    }

    open(encuestas) {
      this.close();

      const pending = SurveyDomain.getPending(encuestas);
      const lastCompleted = SurveyDomain.getLastCompleted(encuestas);
      const isCompleted = pending.length === 0;

      let forced = false;
      if (!isCompleted) {
        forced =
          !lastCompleted?.completed_at ||
          SurveyDomain.isForcedExpired(
            lastCompleted.completed_at,
            this.config.cooldownMinutes,
          );
      }

      this.togglePageLock(true);

      const overlay = document.createElement("div");
      overlay.className = this.config.selectors.overlayClass;

      const countdownHtml = forced
        ? `<div class="encuestacursos-alert-expired mb-3 text-center">⚠️ El tiempo ha expirado. Debes completar las encuestas.</div>`
        : !isCompleted
          ? `<div class="encuestacursos-alert-timer mb-3 d-flex align-items-center justify-content-center gap-2">
            <span>⏳ Puedes ocultar este modal durante:</span>
            <strong id="countdown-timer" style="color:#b41a13; font-family:monospace; font-size:15px;">--:--</strong>
          </div>`
          : `<div class="alert alert-success mb-3 text-center" style="border-radius:8px; font-weight:500;">
            🎉 Encuestas completadas
          </div>`;

      const lastCompletedHtml = lastCompleted
        ? `<div class="alert alert-light border mb-3 py-1 px-2 text-muted small" style="border-radius:6px;">Última respuesta: ${SurveyDomain.formatDate(lastCompleted.completed_at)}</div>`
        : "";

      const closeBtn = forced
        ? ""
        : `<button class="encuestacursos-close-btn" id="close-btn" title="Cerrar">&times;</button>`;

      const sectionsHtml = SurveyViewRenderer.renderSections(
        encuestas,
        this.redirectTo,
        false,
      );

      overlay.innerHTML = `
        <div class="encuestacursos-modal text-center">
          ${closeBtn}
          <img src="${this.config.imgUrl}" style="width: 100%; max-width: 520px; border-radius: 8px; margin: 0 auto;" class="mb-3" />
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
        document
          .getElementById("close-btn")
          ?.addEventListener("click", () => this.close());
      }

      if (!forced && lastCompleted?.completed_at && !isCompleted) {
        this.timer.start(
          lastCompleted.completed_at,
          (timeFormatted) => {
            const timerEl = document.getElementById("countdown-timer");
            if (timerEl) timerEl.textContent = timeFormatted;
          },
          () => {
            const alertEl = document.querySelector(
              `.${this.config.selectors.overlayClass} .encuestacursos-alert-timer`,
            );
            if (alertEl) {
              alertEl.className =
                "encuestacursos-alert-expired mb-3 text-center";
              alertEl.innerHTML =
                "⚠️ El tiempo ha expirado. Debes completar las encuestas.";
            }
          },
        );
      }
    }

    close() {
      const overlay = document.querySelector(
        `.${this.config.selectors.overlayClass}`,
      );
      if (overlay) {
        overlay.remove();
        document.body.style.overflow = "";
      }
      this.togglePageLock(false);
      this.timer.stop();
    }

    togglePageLock(lock) {
      const pageWrapper = document.getElementById(
        this.config.selectors.pageWrapperId,
      );
      if (pageWrapper) {
        if (lock) {
          pageWrapper.style.cssText +=
            "overflow: hidden !important; height: 100vh !important;";
        } else {
          pageWrapper.style.overflow = "";
          pageWrapper.style.height = "";
        }
      }
    }
  }

  // ==========================================================================
  // 10. APLICACIÓN ORQUESTADORA (SRP / DIP: Coordina servicios y vistas)
  // ==========================================================================
  class SurveyApp {
    constructor(config, apiClient, storage) {
      this.config = config;
      this.apiClient = apiClient;
      this.storage = storage;
      this.timer = new CountdownTimer(config.cooldownMinutes);
      this.modal = new SurveyModal(config, this.timer);
      this.fab = new SurveyFab(config.selectors.fabId, () => {
        if (this.encuestas.length) {
          this.modal.open(this.encuestas);
        }
      });
      this.encuestas = [];
    }

    async start() {
      // 1. Validar fecha de inicio
      if (Date.now() < new Date(this.config.startDate).getTime()) {
        return;
      }

      // 2. Validar cooldown por caché local
      if (this.storage.isCoolingDown()) {
        return;
      }

      // 3. Consultar encuestas al servidor
      try {
        this.encuestas = await this.apiClient.fetchSurveys(
          this.config.templateId,
        );
      } catch (err) {
        if (err?.status === 404 || err?.statusCode === 404) {
          this.storage.setCooldownHours(this.config.errorCooldownHours);
        }
        console.error("Error al obtener encuestas:", err);
        return;
      }

      // 4. Si no hay encuestas, pausar consultas por 1 hora
      if (!this.encuestas || !this.encuestas.length) {
        this.storage.setCooldownHours(this.config.errorCooldownHours);
        return;
      }

      // 5. Renderizar bloque si existe en la página
      this.renderMoodleBlock();

      const pending = SurveyDomain.getPending(this.encuestas);
      const allCompleted = pending.length === 0;

      // 6. El FAB siempre debe aparecer si hay encuestas
      this.fab.show(allCompleted);

      // 7. Si ya están todas completadas, no forzar popup
      if (allCompleted) {
        return;
      }

      // 8. Evaluar si debe forzarse la apertura del modal por tiempo
      const lastCompleted = SurveyDomain.getLastCompleted(this.encuestas);
      const lastCompletedAt = lastCompleted?.completed_at;
      const forcedByTime =
        !lastCompletedAt ||
        SurveyDomain.isForcedExpired(
          lastCompletedAt,
          this.config.cooldownMinutes,
        );

      if (forcedByTime) {
        this.modal.open(this.encuestas);
      }
    }

    renderMoodleBlock() {
      const container = document.getElementById(
        this.config.selectors.moodleBlockContainerId,
      );
      if (!container) return;

      const redirectTo = encodeURIComponent(window.location.href);
      container.innerHTML = SurveyViewRenderer.renderSections(
        this.encuestas,
        redirectTo,
        true,
      );
    }
  }

  // ==========================================================================
  // INICIALIZACIÓN EN DOMContentLoaded
  // ==========================================================================
  document.addEventListener("DOMContentLoaded", () => {
    const userId = window.M?.cfg?.userId;
    const token = window.M?.cfg?.jwttoken;

    if (!userId || Number(userId) <= 0 || !token) {
      return;
    }

    StyleInjector.inject();

    const storage = new CooldownStorage(userId, CONFIG.storagePrefix);
    const apiClient = new SurveyApiClient(CONFIG.appUrl, token);
    const app = new SurveyApp(CONFIG, apiClient, storage);

    app.start();
  });
})();
