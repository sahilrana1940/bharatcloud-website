/* BharatCloud desktop workspace.
   Roles come from the signed-in email. Employee screens never render the company quota. */

const SUPABASE_URL = "https://sefrwxkzcomsfyjjcatx.workspace.co";
const SUPABASE_KEY = "sb_publishable_HrKptuMK3nk1HNIA2GPWsQ_tZH01eV_";
const COMPANY_DOMAIN = "bharatcloud.in";
const BLOCKED_FORWARD_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "ymail.com",
  "rocketmail.com",
]);

const workspace = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

const state = {
  session: null,
  role: null,
  profile: null,
  view: "home",
  busy: false,
  error: "",
  notice: "",
  employees: [],
  uploads: [],
  shares: [],
  mails: [],
  payments: [],
};

const app = document.getElementById("app");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function roleFor(email) {
  const value = String(email || "").trim().toLowerCase();
  if (value === "admin@bharatcloud.in") return "admin";
  if (value === "payment@bharatcloud.in") return "payment";
  if (value.endsWith("@bharatcloud.in")) return "employee";
  return null;
}

function isCompanyAddress(email) {
  const value = String(email || "").trim().toLowerCase();
  const parts = value.split("@");
  if (parts.length !== 2 || !parts[0] || parts[1] !== COMPANY_DOMAIN) return false;
  return !BLOCKED_FORWARD_DOMAINS.has(parts[1]);
}

function formatBytes(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function inr(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(amount) || 0);
}

function fileKind(file) {
  const type = file.type || "";
  if (type.startsWith("image/")) return "photo";
  if (type.startsWith("video/")) return "video";
  return "file";
}

function setBusy(busy) {
  state.busy = busy;
  render();
}

function showError(error) {
  state.error = error instanceof Error ? error.message : String(error || "Something went wrong");
  state.notice = "";
  render();
}

async function boot() {
  render();
  try {
    const { data, error } = await workspace.auth.getSession();
    if (error) {
      state.error = error.message;
      render();
      return;
    }
    if (data.session) await enter(data.session);
  } catch (error) {
    state.error = error instanceof Error ? error.message : "Could not reach BharatCloud sign-in.";
    render();
  }
}

async function enter(session) {
  const email = session.user.email || "";
  const role = roleFor(email);
  if (!role) {
    await workspace.auth.signOut();
    state.session = null;
    state.role = null;
    state.error = "Use a @bharatcloud.in workspace account.";
    render();
    return;
  }

  state.session = session;
  state.role = role;
  state.error = "";
  state.view = role === "employee" ? "drive" : "home";

  const { data: profile } = await workspace.from("profiles").select("*").eq("email", email.toLowerCase()).maybeSingle();
  state.profile = profile;

  if (role === "employee") {
    const { data, error } = await workspace.rpc("backup_emp_first_login");
    if (error) state.error = error.message;
    else if (data && data.backed_up) state.notice = `Employee ID ${data.emp_id} saved to backup.`;
  }

  await refresh();
}

async function refresh() {
  state.error = "";
  if (state.role === "admin") {
    const [employees, uploads] = await Promise.all([
      workspace.from("employees").select("*").order("emp_id"),
      workspace.from("uploads").select("*").order("created_at", { ascending: false }),
    ]);
    if (employees.error) state.error = employees.error.message;
    if (uploads.error) state.error = uploads.error.message;
    state.employees = employees.data || [];
    state.uploads = uploads.data || [];
  } else if (state.role === "payment") {
    const payments = await workspace.from("payments").select("*").order("created_at", { ascending: false });
    if (payments.error) state.error = payments.error.message;
    state.payments = payments.data || [];
  } else if (state.role === "employee") {
    const email = state.session.user.email.toLowerCase();
    const [uploads, shares, mails] = await Promise.all([
      workspace.from("uploads").select("*").eq("owner_email", email).order("created_at", { ascending: false }),
      workspace.from("drive_shares").select("id, upload_id, shared_with, created_at, uploads(*)").eq("shared_with", email),
      workspace.from("mails").select("*").eq("owner_email", email).order("created_at", { ascending: false }),
    ]);
    if (uploads.error) state.error = uploads.error.message;
    if (shares.error) state.error = shares.error.message;
    if (mails.error) state.error = mails.error.message;
    state.uploads = uploads.data || [];
    state.shares = shares.data || [];
    state.mails = mails.data || [];
  }
  render();
}

async function signIn(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  if (!roleFor(email)) {
    showError("This workspace only signs in @bharatcloud.in accounts.");
    return;
  }
  setBusy(true);
  const { data, error } = await workspace.auth.signInWithPassword({ email, password });
  state.busy = false;
  if (error) {
    showError(error.message);
    return;
  }
  await enter(data.session);
}

async function signOut() {
  await workspace.auth.signOut();
  state.session = null;
  state.role = null;
  state.profile = null;
  state.notice = "";
  state.error = "";
  state.employees = [];
  state.uploads = [];
  state.shares = [];
  state.mails = [];
  state.payments = [];
  render();
}

async function createEmployee(event) {
  event.preventDefault();
  if (state.role !== "admin") return;
  const form = new FormData(event.target);
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  if (!isCompanyAddress(email)) {
    showError("New employees need an @bharatcloud.in email.");
    return;
  }
  setBusy(true);
  const created = await workspace.rpc("create_employee", { p_name: name, p_email: email });
  if (created.error) {
    state.busy = false;
    showError(created.error.message);
    return;
  }

  const signup = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "bharatcloud-create-emp",
    },
  });
  const account = await signup.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  state.busy = false;
  if (account.error) {
    state.notice = `${created.data} is on the employee list. Login setup needs attention: ${account.error.message}`;
  } else {
    state.notice = `${name} added as ${created.data}. They can sign in with the password you set.`;
  }
  await refresh();
}

async function uploadFile(event) {
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  if (!file || state.role !== "employee") return;
  const email = state.session.user.email.toLowerCase();
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
  const path = `${email}/${crypto.randomUUID()}-${safeName}`;
  setBusy(true);
  const uploaded = await workspace.storage.from("drive").upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
  if (uploaded.error) {
    state.busy = false;
    showError(uploaded.error.message);
    return;
  }
  const row = await workspace.from("uploads").insert({
    owner_email: email,
    file_name: file.name,
    file_type: fileKind(file),
    mime_type: file.type || "application/octet-stream",
    storage_path: path,
    size_bytes: file.size,
    link_sharing: false,
  });
  state.busy = false;
  if (row.error) {
    await workspace.storage.from("drive").remove([path]);
    showError(row.error.message);
    return;
  }
  state.notice = `${file.name} uploaded. Link sharing stays off.`;
  await refresh();
}

async function shareFile(event) {
  event.preventDefault();
  if (state.role !== "employee") return;
  const form = new FormData(event.target);
  const uploadId = String(form.get("upload_id") || "");
  const target = String(form.get("shared_with") || "").trim().toLowerCase();
  const owner = state.session.user.email.toLowerCase();
  if (!isCompanyAddress(target)) {
    showError("Share only with an @bharatcloud.in address. Gmail and Yahoo are blocked.");
    return;
  }
  if (target === owner) {
    showError("Choose a colleague's @bharatcloud.in address.");
    return;
  }
  const saved = await workspace.from("drive_shares").insert({
    upload_id: uploadId,
    owner_email: owner,
    shared_with: target,
  });
  if (saved.error) {
    showError(saved.error.message);
    return;
  }
  event.target.reset();
  state.notice = `Shared with ${target}. No public link was created.`;
  await refresh();
}

async function downloadFile(path, name) {
  const result = await workspace.storage.from("drive").download(path);
  if (result.error) {
    showError(result.error.message);
    return;
  }
  const url = URL.createObjectURL(result.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

async function removeFile(id, path) {
  if (state.role !== "employee") return;
  const removed = await workspace.from("uploads").delete().eq("id", id);
  if (removed.error) {
    showError(removed.error.message);
    return;
  }
  await workspace.storage.from("drive").remove([path]);
  state.notice = "File removed from your drive.";
  await refresh();
}

async function sendMail(event) {
  event.preventDefault();
  if (state.role !== "employee") return;
  const form = new FormData(event.target);
  const to = String(form.get("to_email") || "").trim().toLowerCase();
  const subject = String(form.get("subject") || "").trim();
  const body = String(form.get("body") || "").trim();
  if (!isCompanyAddress(to)) {
    showError("Mail can go only to @bharatcloud.in. Gmail and Yahoo are blocked.");
    return;
  }
  const sent = await workspace.rpc("send_company_mail", {
    p_to: to,
    p_subject: subject,
    p_body: body,
  });
  if (sent.error) {
    showError(sent.error.message);
    return;
  }
  event.target.reset();
  state.notice = "Mail sent inside BharatCloud. Auto backup is on.";
  await refresh();
}

async function forwardMail(event) {
  event.preventDefault();
  if (state.role !== "employee") return;
  const form = new FormData(event.target);
  const mailId = String(form.get("mail_id") || "");
  const to = String(form.get("to_email") || "").trim().toLowerCase();
  const domain = to.split("@")[1] || "";
  if (BLOCKED_FORWARD_DOMAINS.has(domain) || !isCompanyAddress(to)) {
    showError("Forwarding to Gmail or Yahoo is blocked. Use an @bharatcloud.in address.");
    return;
  }
  const forwarded = await workspace.rpc("forward_company_mail", {
    p_mail_id: mailId,
    p_to: to,
  });
  if (forwarded.error) {
    showError(forwarded.error.message);
    return;
  }
  state.notice = `Forwarded to ${to}. A backup row was kept.`;
  await refresh();
}

async function recordPayment(event) {
  event.preventDefault();
  if (state.role !== "payment") return;
  const form = new FormData(event.target);
  const saved = await workspace.rpc("record_payment", {
    p_email: String(form.get("email") || ""),
    p_name: String(form.get("name") || ""),
    p_amount: Number(form.get("amount") || 0),
    p_status: String(form.get("status") || "pending"),
    p_note: String(form.get("note") || ""),
  });
  if (saved.error) {
    showError(saved.error.message);
    return;
  }
  event.target.reset();
  state.notice = "Payment recorded.";
  await refresh();
}

async function markPaid(id) {
  if (state.role !== "payment") return;
  const saved = await workspace.rpc("mark_payment_paid", { p_id: id });
  if (saved.error) {
    showError(saved.error.message);
    return;
  }
  state.notice = "Marked as paid.";
  await refresh();
}

function loginView() {
  return `
    <section class="login">
      <div class="brand-pane">
        <div>
          <div class="mark"><i>BC</i> BharatCloud</div>
          <h1>Workspace for <span>laptop and desktop.</span></h1>
          <p class="lede">One login opens the dashboard that belongs to that ID. Employee screens stay on drive and mail.</p>
          <div class="role-list">
            <article><strong>admin@bharatcloud.in</strong><span>Admin dashboard: company quota, employee list, create employee, all uploads.</span></article>
            <article><strong>payment@bharatcloud.in</strong><span>Payment dashboard only: who paid, who is pending, and history.</span></article>
            <article><strong>ramesh@bharatcloud.in</strong><span>Employee dashboard: My Drive and My Mail. Sharing stays inside @bharatcloud.in.</span></article>
          </div>
        </div>
        <p class="muted">Run supabase-setup.sql once, then create these users in Supabase Authentication.</p>
      </div>
      <div class="form-pane">
        <form class="card" data-action="sign-in">
          <h2>Sign in</h2>
          <p class="hint">The dashboard follows the mailbox. There is no mobile version.</p>
          ${state.error ? `<div class="banner">${esc(state.error)}</div>` : ""}
          <label>Work email<input name="email" type="email" autocomplete="username" placeholder="ramesh@bharatcloud.in" required /></label>
          <label>Password<input name="password" type="password" autocomplete="current-password" required /></label>
          <button class="primary full" type="submit" ${state.busy ? "disabled" : ""}>${state.busy ? "Signing in..." : "Open dashboard"}</button>
        </form>
      </div>
    </section>
  `;
}

function shell(title, eyebrow, body) {
  const email = state.session.user.email;
  const nav = state.role === "employee"
    ? `
      <button type="button" data-action="view" data-view="drive" class="${state.view === "drive" ? "active" : ""}">My Drive</button>
      <button type="button" data-action="view" data-view="mail" class="${state.view === "mail" ? "active" : ""}">My Mail</button>
    `
    : "";
  return `
    <section class="shell">
      <aside class="side">
        <div class="mark"><i>BC</i> BharatCloud</div>
        <div class="nav">${nav}</div>
        <div class="who">
          <strong>${esc(email)}</strong>
          ${esc(state.role === "payment" ? "Payment admin" : state.role === "admin" ? "Admin" : state.profile?.emp_id || "Employee")}
          <div style="margin-top:12px"><button class="ghost" type="button" data-action="sign-out">Sign out</button></div>
        </div>
      </aside>
      <main>
        <div class="top">
          <div>
            <div class="eyebrow">${esc(eyebrow)}</div>
            <h2>${esc(title)}</h2>
          </div>
        </div>
        ${state.error ? `<div class="banner">${esc(state.error)}</div>` : ""}
        ${state.notice ? `<div class="ok">${esc(state.notice)}</div>` : ""}
        ${body}
      </main>
    </section>
  `;
}

function adminView() {
  const rows = state.employees.map((person) => `
    <tr>
      <td>${esc(person.emp_id)}</td>
      <td>${esc(person.full_name)}</td>
      <td>${esc(person.email)}</td>
      <td>${esc(formatWhen(person.created_at))}</td>
    </tr>
  `).join("");
  const files = state.uploads.map((file) => `
    <tr>
      <td>${esc(file.owner_email)}</td>
      <td>${esc(file.file_name)}</td>
      <td>${esc(file.file_type)}</td>
      <td>${esc(formatBytes(file.size_bytes))}</td>
      <td>${esc(formatWhen(file.created_at))}</td>
    </tr>
  `).join("");
  return shell("Admin dashboard", "Company workspace", `
    <div class="grid">
      <div>
        <section class="panel">
          <h3>Storage</h3>
          <p class="muted">Company quota</p>
          <div class="meter" aria-label="12.4 gigabytes of 50 gigabytes"><span></span></div>
          <strong>12.4 GB / 50 GB</strong>
          <p class="notice">Used by the BharatCloud workspace.</p>
        </section>
        <section class="panel">
          <h3>Create employee</h3>
          <form data-action="create-employee" style="margin-top:12px">
            <label>Name<input name="name" required placeholder="Ramesh Kumar" /></label>
            <label>Email<input name="email" type="email" required placeholder="name@bharatcloud.in" /></label>
            <label>First password<input name="password" type="password" minlength="6" required /></label>
            <button class="primary" type="submit" ${state.busy ? "disabled" : ""}>Create EMP</button>
          </form>
        </section>
      </div>
      <div>
        <section class="panel">
          <h3>Employee list</h3>
          <table>
            <thead><tr><th>EMP ID</th><th>Name</th><th>Email</th><th>Added</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="4">No employees yet.</td></tr>`}</tbody>
          </table>
        </section>
        <section class="panel">
          <h3>All uploads</h3>
          <table>
            <thead><tr><th>Employee</th><th>File</th><th>Kind</th><th>Size</th><th>When</th></tr></thead>
            <tbody>${files || `<tr><td colspan="5">No uploads yet.</td></tr>`}</tbody>
          </table>
        </section>
      </div>
    </div>
  `);
}

function paymentView() {
  const paid = state.payments.filter((row) => row.status === "paid");
  const pending = state.payments.filter((row) => row.status === "pending");
  const table = (rows, withAction) => rows.map((row) => `
    <tr>
      <td>${esc(row.employee_name)}<div class="muted">${esc(row.employee_email)}</div></td>
      <td>${esc(inr(row.amount_inr))}</td>
      <td><span class="pill ${row.status === "paid" ? "paid" : "pending"}">${esc(row.status)}</span></td>
      <td>${esc(row.note || "—")}</td>
      <td>${esc(formatWhen(row.paid_at || row.created_at))}</td>
      <td>${withAction && row.status === "pending" ? `<button class="ghost" type="button" data-action="mark-paid" data-id="${esc(row.id)}">Mark paid</button>` : ""}</td>
    </tr>
  `).join("");
  return shell("Payment dashboard", "Collections", `
    <div class="kpis">
      <article class="kpi">Paid<b>${paid.length}</b></article>
      <article class="kpi">Pending<b>${pending.length}</b></article>
      <article class="kpi">History<b>${state.payments.length}</b></article>
    </div>
    <div class="grid payments">
      <section class="panel">
        <h3>Record</h3>
        <form data-action="record-payment" style="margin-top:12px">
          <label>Name<input name="name" required /></label>
          <label>Email<input name="email" type="email" required placeholder="name@bharatcloud.in" /></label>
          <label>Amount INR<input name="amount" type="number" min="0" step="1" required /></label>
          <label>Status
            <select name="status">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          <label>Note<input name="note" placeholder="May workspace" /></label>
          <button class="primary" type="submit">Save payment</button>
        </form>
      </section>
      <div>
        <section class="panel">
          <h3>Who paid</h3>
          <table>
            <thead><tr><th>Person</th><th>Amount</th><th>Status</th><th>Note</th><th>When</th><th></th></tr></thead>
            <tbody>${table(paid, false) || `<tr><td colspan="6">Nobody marked paid yet.</td></tr>`}</tbody>
          </table>
        </section>
        <section class="panel">
          <h3>Who is pending</h3>
          <table>
            <thead><tr><th>Person</th><th>Amount</th><th>Status</th><th>Note</th><th>Since</th><th></th></tr></thead>
            <tbody>${table(pending, true) || `<tr><td colspan="6">No pending payments.</td></tr>`}</tbody>
          </table>
        </section>
        <section class="panel">
          <h3>Payment history</h3>
          <table>
            <thead><tr><th>Person</th><th>Amount</th><th>Status</th><th>Note</th><th>When</th><th></th></tr></thead>
            <tbody>${table(state.payments, false) || `<tr><td colspan="6">No payment history.</td></tr>`}</tbody>
          </table>
        </section>
      </div>
    </div>
  `);
}

function driveView() {
  const mine = state.uploads.map((file) => `
    <article class="file">
      <div>
        <strong>${esc(file.file_name)}</strong>
        <div class="muted">${esc(file.file_type)} · ${esc(formatBytes(file.size_bytes))} · ${esc(formatWhen(file.created_at))}</div>
        <form class="share-line" data-action="share-file">
          <input type="hidden" name="upload_id" value="${esc(file.id)}" />
          <input name="shared_with" type="email" placeholder="colleague@bharatcloud.in" required />
          <button class="ghost" type="submit">Share</button>
        </form>
      </div>
      <div class="row-actions">
        <button class="ghost" type="button" data-action="download" data-path="${esc(file.storage_path)}" data-name="${esc(file.file_name)}">Download</button>
        <button class="danger" type="button" data-action="remove-file" data-id="${esc(file.id)}" data-path="${esc(file.storage_path)}">Remove</button>
      </div>
    </article>
  `).join("");
  const shared = state.shares.map((share) => {
    const file = share.uploads;
    if (!file) return "";
    return `
      <article class="file">
        <div>
          <strong>${esc(file.file_name)}</strong>
          <div class="muted">From ${esc(file.owner_email)} · ${esc(formatWhen(share.created_at))}</div>
        </div>
        <button class="ghost" type="button" data-action="download" data-path="${esc(file.storage_path)}" data-name="${esc(file.file_name)}">Download</button>
      </article>
    `;
  }).join("");
  return `
    <div class="split">
      <section class="panel">
        <h3>Upload</h3>
        <p class="notice">Photo, video, or file. Share only with @bharatcloud.in. Link sharing is off.</p>
        <label class="primary" style="display:inline-block;margin-top:14px">
          Choose a file
          <input data-action="upload" type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" hidden />
        </label>
        <div class="files" style="margin-top:16px">${mine || `<p class="muted">Your drive is empty.</p>`}</div>
      </section>
      <section class="panel">
        <h3>Shared with me</h3>
        <div class="files" style="margin-top:12px">${shared || `<p class="muted">Nothing shared with you yet.</p>`}</div>
      </section>
    </div>
  `;
}

function mailView() {
  const sent = state.mails.filter((mail) => mail.folder === "sent");
  const inbox = state.mails.filter((mail) => mail.folder === "inbox");
  const list = (rows) => rows.map((mail) => `
    <article class="file">
      <div>
        <strong>${esc(mail.subject || "(no subject)")}</strong>
        <div class="muted">${esc(mail.from_email)} → ${esc(mail.to_email)} · ${esc(formatWhen(mail.created_at))}</div>
        <p>${esc(mail.body)}</p>
        <form class="share-line" data-action="forward-mail">
          <input type="hidden" name="mail_id" value="${esc(mail.id)}" />
          <input name="to_email" type="email" placeholder="colleague@bharatcloud.in" required />
          <button class="ghost" type="submit">Forward</button>
        </form>
      </div>
    </article>
  `).join("");
  return `
    <div class="split">
      <section class="panel">
        <h3>Compose</h3>
        <p class="notice">Auto backup is on. Forwarding outside @bharatcloud.in is blocked, including Gmail and Yahoo.</p>
        <form data-action="send-mail" style="margin-top:12px">
          <label>To<input name="to_email" type="email" required placeholder="colleague@bharatcloud.in" /></label>
          <label>Subject<input name="subject" required /></label>
          <label>Message<textarea name="body" required></textarea></label>
          <button class="primary" type="submit">Send inside BharatCloud</button>
        </form>
      </section>
      <div>
        <section class="panel">
          <h3>Inbox</h3>
          <div class="files" style="margin-top:12px">${list(inbox) || `<p class="muted">Inbox is empty.</p>`}</div>
        </section>
        <section class="panel">
          <h3>Sent</h3>
          <div class="files" style="margin-top:12px">${list(sent) || `<p class="muted">No sent mail yet.</p>`}</div>
        </section>
      </div>
    </div>
  `;
}

function employeeView() {
  const body = state.view === "mail" ? mailView() : driveView();
  const title = state.view === "mail" ? "My Mail" : "My Drive";
  return shell(title, state.profile?.emp_id || "Employee", body);
}

function render() {
  if (!state.session) {
    app.innerHTML = loginView();
    return;
  }
  if (state.role === "admin") app.innerHTML = adminView();
  else if (state.role === "payment") app.innerHTML = paymentView();
  else app.innerHTML = employeeView();
}

app.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-action]");
  if (!form) return;
  const action = form.dataset.action;
  if (action === "sign-in") signIn(event);
  if (action === "create-employee") createEmployee(event);
  if (action === "share-file") shareFile(event);
  if (action === "send-mail") sendMail(event);
  if (action === "forward-mail") forwardMail(event);
  if (action === "record-payment") recordPayment(event);
});

app.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || button.tagName === "FORM") return;
  const action = button.dataset.action;
  if (action === "sign-out") signOut();
  if (action === "view") {
    state.view = button.dataset.view;
    state.notice = "";
    render();
  }
  if (action === "download") downloadFile(button.dataset.path, button.dataset.name);
  if (action === "remove-file") removeFile(button.dataset.id, button.dataset.path);
  if (action === "mark-paid") markPaid(button.dataset.id);
});

app.addEventListener("change", (event) => {
  if (event.target.matches("input[data-action='upload']")) uploadFile(event);
});

window.BharatCloud = { roleFor, isCompanyAddress };

boot();
