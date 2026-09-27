"use client";
import { useState } from "react";
import { messageTemplate } from "../message-templates";

export function ContactTools() {
  const [text, setText] = useState(messageTemplate("follow_up"));
  return <section aria-labelledby="contact-tools-title" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
    <h2 id="contact-tools-title" className="text-xl font-semibold">Plantillas para el personal</h2>
    <p>No se envían mensajes desde el portal. Revisá el texto y copialo manualmente al canal autorizado; registrá después el contacto.</p>
    <label className="block">Tipo de mensaje<select className="ml-2 rounded border p-2" defaultValue="follow_up" onChange={(e) => setText(messageTemplate(e.target.value as "follow_up" | "appointment"))}>
      <option value="follow_up">Seguimiento</option><option value="appointment">Coordinar atención</option>
    </select></label>
    <label className="block">Texto editable<textarea className="mt-2 w-full rounded border p-3" rows={5} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} /></label>
  </section>;
}
