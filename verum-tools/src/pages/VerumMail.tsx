import React, { useEffect, useState } from "react";
import { Settings, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import styles from "./VerumMail.module.css";

function subjectFromFilename(filename: string): string {
  const base = filename.replace(/\.pdf$/i, "");
  const idx = base.indexOf("_");
  if (idx === -1) return base.trim();
  return base.slice(0, idx).trim();
}

const MONTHS: Record<string, number> = {
  ene: 1, jan: 1, feb: 2, mar: 3, abr: 4, apr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, aug: 8, sep: 9, oct: 10, nov: 11, dic: 12, dec: 12,
};

function dateFromFilename(filename: string): string {
  const base = filename.replace(/\.pdf$/i, "");
  const ddm = base.match(/(\d{1,2})\.(Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic|Jan|Apr|Aug|Dec)\.(\d{4})/i);
  if (ddm) {
    const day = parseInt(ddm[1], 10);
    const month = MONTHS[ddm[2].toLowerCase().slice(0, 3)];
    const year = parseInt(ddm[3], 10);
    if (month && day >= 1 && day <= 31)
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const mdy = base.match(/(Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic|Jan|Apr|Aug|Dec)\.(\d{1,2})\.(\d{4})/i);
  if (mdy) {
    const month = MONTHS[mdy[1].toLowerCase().slice(0, 3)];
    const day = parseInt(mdy[2], 10);
    const year = parseInt(mdy[3], 10);
    if (month && day >= 1 && day <= 31)
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return "";
}

export function VerumMail() {
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [recipients, setRecipients] = useState<{ id: string; email: string }[]>([]);
  const [newRecipient, setNewRecipient] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [view, setView] = useState<"compose" | "manage">("compose");
  const [meetingLink, setMeetingLink] = useState("");
  const [newMeetingLink, setNewMeetingLink] = useState("");
  const [linkSaving, setLinkSaving] = useState(false);
  const [linkSaved, setLinkSaved] = useState(false);

  useEffect(() => {
    supabase
      .from("recipients")
      .select("id, email")
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setRecipients(data); });

    supabase
      .from("config")
      .select("value")
      .eq("key", "meeting_link")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          setMeetingLink(data.value);
          setNewMeetingLink(data.value);
        }
      });
  }, []);

  const handleSaveMeetingLink = async () => {
    const trimmed = newMeetingLink.trim();
    if (!trimmed || trimmed === meetingLink) return;
    setLinkSaving(true);
    const { error } = await supabase
      .from("config")
      .update({ value: trimmed })
      .eq("key", "meeting_link");
    if (!error) {
      setMeetingLink(trimmed);
      setLinkSaved(true);
      setTimeout(() => setLinkSaved(false), 2500);
    }
    setLinkSaving(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPdfFile(file);
    if (file) {
      const parsedSubject = subjectFromFilename(file.name);
      const parsedDate = dateFromFilename(file.name);
      if (parsedSubject) setSubject(parsedSubject);
      if (parsedDate) setDate(parsedDate);
    }
  };

  const handleAddRecipient = async () => {
    const trimmed = newRecipient.trim();
    if (!trimmed) return;
    if (recipients.some((r) => r.email === trimmed)) { setNewRecipient(""); return; }
    const { data, error } = await supabase
      .from("recipients")
      .insert({ email: trimmed })
      .select("id, email")
      .single();
    if (!error && data) setRecipients((prev) => [...prev, data]);
    setNewRecipient("");
  };

  const handleRemoveRecipient = async (id: string) => {
    const { error } = await supabase.from("recipients").delete().eq("id", id);
    if (!error) setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!subject.trim() || !date || !time || !pdfFile) {
      setError("Completa todos los campos y adjunta un PDF.");
      setSuccess(null);
      return;
    }
    setError(null);
    setSuccess(null);
    setIsSending(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL ?? "";
      const useVercelApi = !apiBase;
      let response: Response;

      if (useVercelApi) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
          reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
          reader.readAsDataURL(pdfFile);
        });
        response = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: subject.trim(), date, time,
            message: message.trim(),
            pdfBase64: base64,
            pdfFilename: pdfFile.name,
            recipients: recipients.map((r) => r.email),
          }),
        });
      } else {
        const formData = new FormData();
        formData.append("subject", subject.trim());
        formData.append("date", date);
        formData.append("time", time);
        formData.append("message", message.trim());
        formData.append("pdf", pdfFile);
        formData.append("recipients", JSON.stringify(recipients.map((r) => r.email)));
        response = await fetch(`${apiBase}/send-email`, { method: "POST", body: formData });
      }

      const data = await response.json().catch(() => ({ success: response.ok }));
      if (!response.ok || !data?.success) {
        throw new Error(
          (data && typeof data.error === "string" && data.error) ||
          "No se pudo enviar el correo. Inténtalo de nuevo."
        );
      }
      setSuccess("Correo enviado correctamente.");
      setSubject(""); setDate(""); setTime(""); setMessage(""); setPdfFile(null);
      const pdfInput = form.elements.namedItem("pdf") as HTMLInputElement | null;
      if (pdfInput) pdfInput.value = "";
    } catch (sendError: unknown) {
      const msg = sendError instanceof Error ? sendError.message : "No se pudo enviar el correo. Inténtalo de nuevo.";
      setError(msg);
      setSuccess(null);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="page">
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className="page-title">Verum Mail</h1>
          <p className="page-subtitle">Crea correos de comité con adjuntos.</p>
        </div>
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setView(view === "compose" ? "manage" : "compose")}
          aria-label={view === "compose" ? "Administrar destinatarios" : "Regresar al formulario"}
        >
          {view === "compose"
            ? <Settings size={17} />
            : <><ArrowLeft size={15} /><span>Regresar</span></>
          }
        </button>
      </div>

      {/* Compose view */}
      {view === "compose" ? (
        <div className={`card ${styles.formCard}`}>
          <p className={styles.sectionTitle}>Crear sesión de comité</p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.field}>
              <span>Adjunto PDF</span>
              <input type="file" name="pdf" accept="application/pdf,.pdf" onChange={handleFileChange} />
            </label>

            {pdfFile && (
              <p className={styles.hint}>
                Archivo seleccionado: <strong>{pdfFile.name}</strong>
              </p>
            )}

            <label className={styles.field}>
              <span>Emisor</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Nombre del Emisor"
              />
            </label>

            <label className={styles.field}>
              <span>Cuerpo del correo</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Déjalo vacío para usar el mensaje predeterminado, o escribe tu propio texto."
                rows={4}
              />
            </label>

            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Fecha</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Hora</span>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </label>
            </div>

            {error && <p className={styles.error}>{error}</p>}
            {success && <p className={styles.success}>{success}</p>}

            <button type="submit" className={styles.primaryButton} disabled={isSending}>
              {isSending ? "Enviando…" : "Enviar correo"}
            </button>
          </form>
        </div>
      ) : (
        /* Manage view */
        <div className={`card ${styles.formCard}`}>
          <p className={styles.sectionTitle}>Administrar destinatarios</p>
          <div className={styles.form}>
            <div className={styles.field}>
              <span>Agregar correo destinatario</span>
              <div className={styles.fieldGrid}>
                <input
                  type="email"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRecipient())}
                  placeholder="ej. usuario@empresa.com"
                />
                <button type="button" className={styles.primaryButton} onClick={handleAddRecipient}>
                  Agregar
                </button>
              </div>
            </div>

            {recipients.length > 0 && (
              <div className={styles.field}>
                <span>Destinatarios actuales</span>
                <ul className={styles.recipientList}>
                  {recipients.map((r) => (
                    <li key={r.id} className={styles.recipientItem}>
                      <span>{r.email}</span>
                      <button
                        type="button"
                        className={styles.recipientRemove}
                        onClick={() => handleRemoveRecipient(r.id)}
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <hr className={styles.divider} />

            <div className={styles.field}>
              <span>Liga de reunión (Teams)</span>
              <div className={styles.fieldGrid}>
                <input
                  type="url"
                  value={newMeetingLink}
                  onChange={(e) => { setNewMeetingLink(e.target.value); setLinkSaved(false); }}
                  placeholder="https://teams.live.com/meet/..."
                />
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleSaveMeetingLink}
                  disabled={linkSaving || !newMeetingLink.trim() || newMeetingLink.trim() === meetingLink}
                >
                  {linkSaving ? "Guardando…" : "Guardar"}
                </button>
              </div>
              {linkSaved && <p className={styles.success}>Liga actualizada correctamente.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
