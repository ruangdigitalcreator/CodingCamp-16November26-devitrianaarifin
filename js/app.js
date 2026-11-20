/**
 * Personal Dashboard — js/app.js
 * Single IIFE; exposes the Dashboard namespace on window for test hooks.
 */
(function () {
  'use strict';

  // =========================================================================
  // === UTILITIES ============================================================
  // =========================================================================

  /** Generates a unique identifier. Uses crypto.randomUUID when available. */
  function uid() {
    if (
      typeof crypto !== 'undefined' &&
      typeof crypto.randomUUID === 'function'
    ) {
      return crypto.randomUUID();
    }
    // Fallback: timestamp + random hex
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  // =========================================================================
  // === STORAGE ==============================================================
  // =========================================================================

  const Storage = {
    KEYS: {
      TASKS: 'dashboard.tasks',
      QUICK_LINKS: 'dashboard.quickLinks',
      THEME: 'dashboard.theme',
      USER_NAME: 'dashboard.userName',
    },

    /**
     * Returns true if localStorage is accessible, false otherwise.
     * Never throws.
     */
    isAvailable() {
      try {
        const testKey = '__dash_test__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        return true;
      } catch (_) {
        return false;
      }
    },

    /**
     * Reads and JSON-parses the value stored at `key`.
     * Returns `fallback` if the key is absent, the value is null,
     * or any error occurs. Never throws.
     */
    load(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
      } catch (_) {
        return fallback;
      }
    },

    /**
     * JSON-stringifies `value` and writes it to localStorage at `key`.
     * Returns true on success, false on any failure. Never throws.
     */
    save(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (_) {
        return false;
      }
    },

    /**
     * Removes the item at `key` from localStorage.
     * Returns true on success, false on any failure. Never throws.
     */
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (_) {
        return false;
      }
    },
  };

  // =========================================================================
  // === DOMAIN MODELS (pure) =================================================
  // =========================================================================

  /**
   * GreetingModel — pure, no DOM, no side-effects.
   * All methods take plain values and return plain values.
   */
  const GreetingModel = {
    /**
     * Returns the time-of-day greeting for a given 24-hour clock hour (0–23).
     *   05–11  → "Good morning"
     *   12–16  → "Good afternoon"
     *   17–20  → "Good evening"
     *   21–23 and 0–4 → "Good night"
     */
    greetingForHour(hour) {
      if (hour >= 5  && hour <= 11) return 'Good morning';
      if (hour >= 12 && hour <= 16) return 'Good afternoon';
      if (hour >= 17 && hour <= 20) return 'Good evening';
      return 'Good night';
    },

    /**
     * Returns the time-of-day greeting for a Date instance.
     */
    greetingForDate(date) {
      return this.greetingForHour(date.getHours());
    },

    /**
     * Returns the current time as a zero-padded HH:MM string in 24-hour format.
     * e.g. 9:05 AM → "09:05"
     */
    formatTime(date) {
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      return h + ':' + m;
    },

    /**
     * Returns the current date as a human-readable string.
     * e.g. "Monday, 16 November 2026"
     */
    formatDate(date) {
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day:     'numeric',
        month:   'long',
        year:    'numeric',
      });
    },
  };

  // =========================================================================
  // === TASK MODEL (pure) ====================================================
  // =========================================================================

  /**
   * TaskModel — pure, no DOM, no side-effects.
   * All methods take plain values and return new plain values.
   */
  const TaskModel = {
    /**
     * Creates a new task object.
     * @param {string} text - Non-empty task description.
     * @returns {{ id: string, text: string, done: boolean }}
     */
    create(text) {
      return { id: uid(), text: text.trim(), done: false };
    },

    /**
     * Returns a new task with an updated text field.
     * id and done are preserved unchanged.
     */
    setText(task, text) {
      return { ...task, text: text.trim() };
    },

    /**
     * Returns a new task with the done flag flipped.
     * id and text are preserved unchanged.
     */
    toggleDone(task) {
      return { ...task, done: !task.done };
    },

    /**
     * Returns true if the text is a non-empty string after trimming.
     * Returns false for empty strings, whitespace-only strings, and
     * non-string values.
     */
    isValidText(text) {
      return typeof text === 'string' && text.trim().length > 0;
    },
  };

  // =========================================================================
  // === LINK MODEL (pure) ====================================================
  // =========================================================================

  /**
   * LinkModel — pure, no DOM, no side-effects.
   * All methods take plain values and return new plain values.
   */
  const LinkModel = {
    /**
     * Creates a new quick link object.
     * @param {string} name - Display name for the link.
     * @param {string} url  - Target URL.
     * @returns {{ id: string, name: string, url: string }}
     */
    create(name, url) {
      return { id: uid(), name: name.trim(), url: url.trim() };
    },

    /**
     * Returns a new link with an updated name field.
     * id and url are preserved unchanged.
     */
    setName(link, name) {
      return { ...link, name: name.trim() };
    },

    /**
     * Returns a new link with an updated url field.
     * id and name are preserved unchanged.
     */
    setUrl(link, url) {
      return { ...link, url: url.trim() };
    },
  };

  // =========================================================================
  // === THEME MODEL (pure) ===================================================
  // =========================================================================

  /**
   * ThemeModel — pure, no DOM, no side-effects.
   * All methods take plain values and return plain values.
   */
  const ThemeModel = {
    /**
     * Returns 'dark' when theme is 'light', and 'light' for any other value
     * (including 'dark'). This makes toggle an involution: applying it twice
     * always returns 'light'.
     */
    toggle(theme) {
      return theme === 'light' ? 'dark' : 'light';
    },

    /**
     * Returns the default theme ('light').
     */
    defaultTheme() {
      return 'light';
    },
  };

  // =========================================================================
  // === TIMER MODEL (pure) ===================================================
  // =========================================================================

  /**
   * TimerModel — pure, no DOM, no side-effects.
   * All methods take plain state values and return new plain state values.
   */
  const TimerModel = {
    /** 25 minutes in seconds. */
    INITIAL_SECONDS: 25 * 60, // 1500

    /**
     * Returns the canonical initial/reset timer state.
     * { seconds: 1500, running: false, complete: false }
     */
    reset() {
      return { seconds: this.INITIAL_SECONDS, running: false, complete: false };
    },

    /**
     * Returns a new state with running set to true.
     * If the timer is already complete, returns the state unchanged.
     */
    start(state) {
      if (state.complete) return state;
      return { ...state, running: true };
    },

    /**
     * Returns a new state with running set to false.
     * Seconds are preserved exactly (Req 4.3).
     */
    stop(state) {
      return { ...state, running: false };
    },

    /**
     * Advances the timer by one second.
     * - If not running, returns state unchanged.
     * - If running and seconds > 0, decrements seconds by 1.
     * - If running and seconds === 0, sets running: false and complete: true.
     */
    tick(state) {
      if (!state.running) return state;
      if (state.seconds <= 0) {
        return { ...state, seconds: 0, running: false, complete: true };
      }
      const next = state.seconds - 1;
      if (next <= 0) {
        return { seconds: 0, running: false, complete: true };
      }
      return { ...state, seconds: next };
    },

    /**
     * Formats a seconds value as a zero-padded "MM:SS" string.
     * e.g. 1500 → "25:00", 243 → "04:03", 0 → "00:00"
     */
    format(seconds) {
      const totalSec = Math.max(0, Math.floor(seconds));
      const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
      const ss = String(totalSec % 60).padStart(2, '0');
      return mm + ':' + ss;
    },
  };

  // =========================================================================
  // === CONTROLLERS ==========================================================
  // =========================================================================

  /**
   * GreetingCtrl — renders greeting, time, and date into the #greeting element
   * and refreshes every second (≤ 60 000 ms, satisfying Req 3.6).
   *
   * Expected DOM structure inside the root element:
   *   <span data-greeting></span>
   *   <span data-time></span>
   *   <span data-date></span>
   */
  const GreetingCtrl = {
    root: null,

    /** Attach to the DOM root and start the refresh interval. */
    init(root) {
      if (!root) return;
      this.root = root;
      this.update();
      // Refresh every second so the minute display is always current (Req 3.6).
      setInterval(() => this.update(), 1000);
      this._initNameModal(root);
    },

    /** Opens/manages the name input modal and the edit-name button. */
    _initNameModal(root) {
      const modal   = document.getElementById('name-modal');
      const form    = document.getElementById('name-modal-form');
      const input   = document.getElementById('name-modal-input');
      const editBtn = root && root.querySelector('[data-edit-name]');
      if (!modal) return;

      // Show modal on first visit (no name saved yet)
      const savedName = Storage.load(Storage.KEYS.USER_NAME, '');
      if (!savedName) {
        modal.hidden = false;
        if (input) setTimeout(() => input.focus(), 50);
      }

      // Save name on form submit
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = input ? input.value.trim() : '';
          if (name) {
            Storage.save(Storage.KEYS.USER_NAME, name);
            modal.hidden = true;
            this.update();
          } else {
            if (input) input.focus();
          }
        });
      }

      // Close modal on backdrop click (only if name already set)
      const backdrop = modal.querySelector('.name-modal__backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', () => {
          if (Storage.load(Storage.KEYS.USER_NAME, '')) modal.hidden = true;
        });
      }

      // Edit-name button in greeting opens the modal
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          if (input) input.value = Storage.load(Storage.KEYS.USER_NAME, '');
          modal.hidden = false;
          if (input) { input.focus(); input.select(); }
        });
      }
    },

    /** Read the current time and push values into the sub-elements. */
    update() {
      if (!this.root) return;
      const now = new Date();

      const greetingEl = this.root.querySelector('[data-greeting]');
      const timeEl     = this.root.querySelector('[data-time]');
      const dateEl     = this.root.querySelector('[data-date]');

      if (greetingEl) {
        const savedName = Storage.load(Storage.KEYS.USER_NAME, '');
        const greeting  = GreetingModel.greetingForDate(now);
        greetingEl.textContent = greeting + (savedName ? ', ' + savedName + '!' : '!');
      }
      if (timeEl)     timeEl.textContent     = GreetingModel.formatTime(now);
      if (dateEl)     dateEl.textContent     = GreetingModel.formatDate(now);
    },
  };

  /**
   * TimerCtrl — manages the Focus Timer DOM and interval.
   *
   * Expected DOM structure inside the root element (#timer):
   *   <span data-display></span>          — shows MM:SS countdown
   *   <span data-timer-status></span>      — hidden; shown with "Session complete!" at 00:00
   *   <button data-action="start">Start</button>
   *   <button data-action="stop">Stop</button>
   *   <button data-action="reset">Reset</button>
   *
   * Timer state is intentionally NOT persisted (Req 4.1 — always resets to 25:00 on load).
   */
  const TimerCtrl = {
    state: null,
    intervalId: null,
    root: null,

    /** Attach to the DOM root, set initial display, and bind button actions. */
    init(root) {
      if (!root) return;
      this.root = root;
      this.state = TimerModel.reset();
      this.render();

      // Bind Start / Stop / Reset via event delegation on data-action attributes.
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        if (action === 'start')  this.start();
        else if (action === 'stop')  this.stop();
        else if (action === 'reset') this.reset();
      });
    },

    /** Start counting down. No-op if already running or complete. */
    start() {
      this.state = TimerModel.start(this.state);
      this._startInterval();
      this.render();
    },

    /** Pause the countdown; retain the current time. */
    stop() {
      this.state = TimerModel.stop(this.state);
      this._clearInterval();
      this.render();
    },

    /** Reset to 25:00 and clear any "session complete" indicator. */
    reset() {
      this._clearInterval();
      this.state = TimerModel.reset();
      this.render();
      // Hide the status indicator on reset.
      const statusEl = this.root && this.root.querySelector('[data-timer-status]');
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.hidden = true;
      }
    },

    /** Called once per second by the interval. */
    _step() {
      this.state = TimerModel.tick(this.state);
      if (this.state.complete) {
        this._clearInterval();
        this._showComplete();
      }
      this.render();
    },

    /** Start the 1-second interval if not already running. */
    _startInterval() {
      if (this.intervalId !== null) return;
      this.intervalId = setInterval(() => this._step(), 1000);
    },

    /** Stop and clear the 1-second interval. */
    _clearInterval() {
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },

    /** Show the "session complete" indicator in [data-timer-status]. */
    _showComplete() {
      if (!this.root) return;
      const statusEl = this.root.querySelector('[data-timer-status]');
      if (statusEl) {
        statusEl.textContent = 'Session complete!';
        statusEl.hidden = false;
      }
    },

    /** Push the current state to the DOM. */
    render() {
      if (!this.root) return;
      const displayEl = this.root.querySelector('[data-display]');
      if (displayEl) {
        displayEl.textContent = TimerModel.format(this.state.seconds);
      }
    },
  };

  /**
   * TodoCtrl — manages the To-Do List DOM and in-memory task array.
   *
   * Expected DOM structure inside the root element (#todo):
   *   <form data-todo-form>
   *     <input data-todo-input type="text" />
   *     <button type="submit">Add</button>
   *   </form>
   *   <span data-todo-notice hidden></span>   — inline validation notice
   *   <ul data-todo-list></ul>                — rendered task items
   *
   * Each rendered task <li> contains:
   *   <input type="checkbox" data-task-toggle data-id="<id>" />
   *   <span data-task-text class="task--done?(when done)">task text</span>
   *   <button data-action="edit"   data-id="<id>">Edit</button>
   *   <button data-action="delete" data-id="<id>">Delete</button>
   *
   * Tasks ARE persisted (Req 5.1–5.5); the timer state is not.
   */
  const TodoCtrl = {
    tasks: [],
    root: null,

    /** Attach to the DOM root, load persisted tasks, and bind events. */
    init(root) {
      if (!root) return;
      this.root = root;
      this.tasks = Storage.load(Storage.KEYS.TASKS, []);
      this.render();

      // Bind form submit (add task).
      const form = root.querySelector('[data-todo-form]');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = root.querySelector('[data-todo-input]');
          const text = input ? input.value : '';
          this.addTask(text);
          if (input) input.value = '';
        });
      }

      // Bind edit / delete / toggle via event delegation on the list.
      const list = root.querySelector('[data-todo-list]');
      if (list) {
        list.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-action]');
          if (!btn) return;
          const id     = btn.getAttribute('data-id');
          const action = btn.getAttribute('data-action');
          if (action === 'delete') {
            this.deleteTask(id);
          } else if (action === 'edit') {
            const li   = btn.closest('li');
            const span = li && li.querySelector('[data-task-text]');
            if (!span) return;
            const current = span.textContent;
            const newText = window.prompt('Edit task:', current);
            if (newText !== null) this.editTask(id, newText);
          }
        });

        list.addEventListener('change', (e) => {
          const cb = e.target.closest('[data-task-toggle]');
          if (!cb) return;
          const id = cb.getAttribute('data-id');
          this.toggleTask(id);
        });
      }
    },

    /**
     * Validates text via TaskModel.isValidText.
     * If invalid, shows the inline notice and returns without mutating the list.
     * If valid, creates the task, persists, and re-renders.
     */
    addTask(text) {
      if (!TaskModel.isValidText(text)) {
        this._showNotice('Task cannot be empty.');
        return;
      }
      const trimmed = text.trim().toLowerCase();
      const isDuplicate = this.tasks.some((t) => t.text.toLowerCase() === trimmed);
      if (isDuplicate) {
        this._showNotice('Task already exists.');
        return;
      }
      this._hideNotice();
      this.tasks.push(TaskModel.create(text));
      this._persist();
      this.render();
    },

    /**
     * Updates the text of the task identified by `id`.
     * No-op if newText is invalid or the id is not found.
     */
    editTask(id, newText) {
      if (!TaskModel.isValidText(newText)) return;
      this.tasks = this.tasks.map((t) =>
        t.id === id ? TaskModel.setText(t, newText) : t
      );
      this._persist();
      this.render();
    },

    /**
     * Toggles the done state of the task identified by `id`.
     */
    toggleTask(id) {
      this.tasks = this.tasks.map((t) =>
        t.id === id ? TaskModel.toggleDone(t) : t
      );
      this._persist();
      this.render();
    },

    /**
     * Removes the task identified by `id` from the list.
     */
    deleteTask(id) {
      this.tasks = this.tasks.filter((t) => t.id !== id);
      this._persist();
      this.render();
    },

    /**
     * Clears [data-todo-list] and re-renders all tasks.
     * Each <li> contains a checkbox, text span (task--done when done),
     * Edit button, and Delete button.
     */
    render() {
      if (!this.root) return;
      const list = this.root.querySelector('[data-todo-list]');
      if (!list) return;

      list.innerHTML = '';
      this.tasks.forEach((task) => {
        const li = document.createElement('li');
        li.className = 'todo-item';

        // Checkbox toggle
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = task.done;
        cb.setAttribute('data-task-toggle', '');
        cb.setAttribute('data-id', task.id);
        cb.setAttribute('aria-label', 'Mark done');

        // Text span
        const span = document.createElement('span');
        span.setAttribute('data-task-text', '');
        span.textContent = task.text;
        if (task.done) span.classList.add('task--done');

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = 'Edit';
        editBtn.setAttribute('data-action', 'edit');
        editBtn.setAttribute('data-id', task.id);

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = 'Delete';
        delBtn.setAttribute('data-action', 'delete');
        delBtn.setAttribute('data-id', task.id);

        li.appendChild(cb);
        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(delBtn);
        list.appendChild(li);
      });
    },

    /** Persists the current task array to Local Storage. */
    _persist() {
      Storage.save(Storage.KEYS.TASKS, this.tasks);
    },

    /** Shows the inline validation notice with the given message. */
    _showNotice(message) {
      if (!this.root) return;
      const el = this.root.querySelector('[data-todo-notice]');
      if (el) {
        el.textContent = message;
        el.hidden = false;
      }
    },

    /** Hides the inline validation notice. */
    _hideNotice() {
      if (!this.root) return;
      const el = this.root.querySelector('[data-todo-notice]');
      if (el) {
        el.textContent = '';
        el.hidden = true;
      }
    },
  };

  // =========================================================================
  // === LINKS CONTROLLER =====================================================
  // =========================================================================

  /**
   * LinksCtrl — manages the Quick Links DOM and in-memory links array.
   *
   * Expected DOM structure inside the root element (#links):
   *   <form data-links-form>
   *     <input data-links-name  type="text" placeholder="Name" />
   *     <input data-links-url   type="url"  placeholder="URL" />
   *     <button type="submit">Add Link</button>
   *   </form>
   *   <div data-links-container></div>   — rendered link buttons
   *
   * Each rendered link entry contains:
   *   <button data-action="open" data-id="<id>">link name</button>
   *   <button data-action="edit"   data-id="<id>">Edit</button>
   *   <button data-action="remove" data-id="<id>">Remove</button>
   *
   * Quick Links ARE persisted (Req 6.1–6.5).
   */
  const LinksCtrl = {
    links: [],
    root: null,

    /** Attach to the DOM root, load persisted links, and bind events. */
    init(root) {
      if (!root) return;
      this.root = root;
      this.links = Storage.load(Storage.KEYS.QUICK_LINKS, []);
      this.render();

      // Bind form submit (add link).
      const form = root.querySelector('[data-links-form]');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const nameInput = root.querySelector('[data-links-name]');
          const urlInput  = root.querySelector('[data-links-url]');
          const name = nameInput ? nameInput.value : '';
          const url  = urlInput  ? urlInput.value  : '';
          this.addLink(name, url);
          if (nameInput) nameInput.value = '';
          if (urlInput)  urlInput.value  = '';
        });
      }

      // Bind open / edit / remove via event delegation on the container.
      const container = root.querySelector('[data-links-container]');
      if (container) {
        container.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-action]');
          if (!btn) return;
          const id     = btn.getAttribute('data-id');
          const action = btn.getAttribute('data-action');

          if (action === 'open') {
            const link = this.links.find((l) => l.id === id);
            if (link) this.openLink(link.url);
          } else if (action === 'remove') {
            this.removeLink(id);
          } else if (action === 'edit') {
            const link = this.links.find((l) => l.id === id);
            if (!link) return;
            const newName = window.prompt('Edit name:', link.name);
            if (newName === null) return;
            const newUrl  = window.prompt('Edit URL:', link.url);
            if (newUrl  === null) return;
            this.editLink(id, newName, newUrl);
          }
        });
      }
    },

    /**
     * Creates a new quick link, persists it, and re-renders.
     * Silently ignores calls where both name and url are blank after trimming.
     */
    addLink(name, url) {
      if (
        typeof name !== 'string' || name.trim().length === 0 ||
        typeof url  !== 'string' || url.trim().length  === 0
      ) {
        return;
      }
      this.links.push(LinkModel.create(name, url));
      this._persist();
      this.render();
    },

    /**
     * Updates the name and url of the link identified by `id`.
     * No-op if the id is not found or both values are blank.
     */
    editLink(id, name, url) {
      this.links = this.links.map((l) => {
        if (l.id !== id) return l;
        const updated = typeof name === 'string' && name.trim().length > 0
          ? LinkModel.setName(l, name)
          : l;
        return typeof url === 'string' && url.trim().length > 0
          ? LinkModel.setUrl(updated, url)
          : updated;
      });
      this._persist();
      this.render();
    },

    /**
     * Removes the link identified by `id` from the list.
     */
    removeLink(id) {
      this.links = this.links.filter((l) => l.id !== id);
      this._persist();
      this.render();
    },

    /**
     * Opens the given URL in a new tab.
     */
    openLink(url) {
      window.open(url, '_blank', 'noopener');
    },

    /**
     * Clears [data-links-container] and re-renders all links.
     * Each entry contains an open button, an Edit button, and a Remove button.
     */
    render() {
      if (!this.root) return;
      const container = this.root.querySelector('[data-links-container]');
      if (!container) return;

      container.innerHTML = '';
      this.links.forEach((link) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'link-item';

        // Open button (primary action — clicking navigates to the URL).
        const openBtn = document.createElement('button');
        openBtn.type = 'button';
        openBtn.textContent = link.name;
        openBtn.setAttribute('data-action', 'open');
        openBtn.setAttribute('data-id', link.id);
        openBtn.setAttribute('title', link.url);

        // Edit button.
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = 'Edit';
        editBtn.setAttribute('data-action', 'edit');
        editBtn.setAttribute('data-id', link.id);

        // Remove button.
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'Remove';
        removeBtn.setAttribute('data-action', 'remove');
        removeBtn.setAttribute('data-id', link.id);

        wrapper.appendChild(openBtn);
        wrapper.appendChild(editBtn);
        wrapper.appendChild(removeBtn);
        container.appendChild(wrapper);
      });
    },

    /** Persists the current links array to Local Storage. */
    _persist() {
      Storage.save(Storage.KEYS.QUICK_LINKS, this.links);
    },
  };

  // =========================================================================
  // === THEME CONTROLLER =====================================================
  // =========================================================================

  /**
   * ThemeCtrl — manages the Theme Toggle DOM and applies the theme to
   * `document.documentElement` via the `data-theme` attribute.
   *
   * Expected DOM structure: a single <button> element (the root itself or
   * a child) that the user clicks to toggle the theme.
   *
   *   <button id="theme-toggle">🌙 Dark</button>
   *
   * Theme IS persisted (Req 7.2–7.4).
   * ThemeCtrl.init must be called BEFORE other controllers so the theme is
   * applied before anything else renders, avoiding a flash of the wrong theme.
   */
  const ThemeCtrl = {
    theme: 'light',
    root: null,

    /**
     * Attach to the DOM root, load the persisted theme (or default to light),
     * apply it immediately, and bind the click handler.
     */
    init(root) {
      if (!root) return;
      this.root = root;
      this.theme = Storage.load(Storage.KEYS.THEME, ThemeModel.defaultTheme());
      this.apply(this.theme);

      root.addEventListener('click', () => {
        this.theme = ThemeModel.toggle(this.theme);
        this.apply(this.theme);
      });
    },

    /**
     * Applies `theme` to the document root, persists it, and updates the
     * toggle button label so the user knows what clicking will do next.
     *
     * Label convention:
     *   current theme is 'light' → button shows "🌙 Dark"  (click to go dark)
     *   current theme is 'dark'  → button shows "☀️ Light" (click to go light)
     */
    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      Storage.save(Storage.KEYS.THEME, theme);
      this.theme = theme;
      if (this.root) {
        this.root.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
        this.root.setAttribute('aria-pressed', String(theme === 'dark'));
      }
    },
  };

  // =========================================================================
  // === APP BOOTSTRAP ========================================================
  // =========================================================================

  var App = {
    init: function () {
      // 1. Theme FIRST — avoids flash of wrong theme
      var themeRoot = document.getElementById('theme-toggle');
      if (themeRoot) ThemeCtrl.init(themeRoot);

      // 2. Greeting
      var greetingRoot = document.getElementById('greeting');
      if (greetingRoot) GreetingCtrl.init(greetingRoot);

      // 3. Timer
      var timerRoot = document.getElementById('timer');
      if (timerRoot) TimerCtrl.init(timerRoot);

      // 4. To-Do
      var todoRoot = document.getElementById('todo');
      if (todoRoot) TodoCtrl.init(todoRoot);

      // 5. Quick Links
      var linksRoot = document.getElementById('links');
      if (linksRoot) LinksCtrl.init(linksRoot);
    }
  };

  // Register on DOMContentLoaded
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', App.init);
  }

  // =========================================================================
  // === DASHBOARD NAMESPACE (test hooks) =====================================
  // =========================================================================

  window.Dashboard = window.Dashboard || {};
  window.Dashboard.Storage       = Storage;
  window.Dashboard._uid          = uid;
  window.Dashboard.GreetingModel = GreetingModel;
  window.Dashboard.GreetingCtrl  = GreetingCtrl;
  window.Dashboard.TimerModel    = TimerModel;
  window.Dashboard.TimerCtrl     = TimerCtrl;
  window.Dashboard.TaskModel     = TaskModel;
  window.Dashboard.TodoCtrl      = TodoCtrl;
  window.Dashboard.LinkModel     = LinkModel;
  window.Dashboard.LinksCtrl     = LinksCtrl;
  window.Dashboard.ThemeModel    = ThemeModel;
  window.Dashboard.ThemeCtrl     = ThemeCtrl;
  window.Dashboard.App           = App;

}());
