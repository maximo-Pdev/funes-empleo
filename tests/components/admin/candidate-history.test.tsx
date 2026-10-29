import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ load:vi.fn() }));
vi.mock("@/features/candidates/history-actions", () => ({ loadCandidateHistoryAction:mocks.load }));
import { CandidateHistory } from "@/features/candidates/components/candidate-history";
import type { CandidateHistoryEvent } from "@/features/candidates/candidate-history";
const date="2026-10-24T12:00:00Z", id="0a000000-0000-4000-8000-000000000001";
const initial:CandidateHistoryEvent[] = Array.from({ length:5 },(_,index)=>({ id:`event-${index}`,action:"profile_activated",occurred_at:date }));
const cursor={ occurredAt:date,id };
beforeEach(()=>{ mocks.load.mockReset(); });
it("muestra cinco entradas con evento y fecha, sin datos técnicos ni transiciones",()=>{
  render(<CandidateHistory candidateId={id} initialEvents={initial} initialCursor={cursor} />);
  const region=screen.getByRole("region",{ name:"Historial de cuenta y perfil" });
  expect(within(region).getAllByRole("listitem")).toHaveLength(5);
  expect(region.querySelectorAll("time")).toHaveLength(5);
  expect(region.textContent).not.toMatch(/cta-|→|Cuenta |Motivo:/);
  expect(region.textContent).not.toContain(id);
  expect(screen.getByRole("button",{ name:"Ver más" })).toBeTruthy();
});
it("carga sin navegar ni perder eventos, anuncia resultado y enfoca el primer nuevo",async()=>{
  mocks.load.mockResolvedValue({ success:true,page:{ events:[{ id:"older",action:"consent_withdrawn",occurred_at:date }],nextCursor:null } });
  render(<CandidateHistory candidateId={id} initialEvents={initial} initialCursor={cursor} />);
  fireEvent.click(screen.getByRole("button",{ name:"Ver más" }));
  await screen.findByText("Consentimiento retirado");
  // La fila puede aparecer antes de que useTransition termine de anunciar la carga.
  await waitFor(()=>expect(screen.getByRole("status").textContent).toContain("1 evento anterior cargado"));
  expect(mocks.load).toHaveBeenCalledWith({ candidateId:id,cursor });
  expect(screen.getAllByRole("listitem")).toHaveLength(6);
  expect(screen.getByText("Consentimiento retirado").closest("li")).toBe(document.activeElement);
  expect(screen.queryByRole("button",{ name:"Ver más" })).toBeNull();
});
it("mantiene datos y cursor tras error, permite reintento y no duplica entradas",async()=>{
  mocks.load.mockResolvedValueOnce({ success:false,message:"No se pudo cargar." })
    .mockResolvedValueOnce({ success:true,page:{ events:[initial[4],{ id:"older",action:"profile_linked",occurred_at:date }],nextCursor:null } });
  render(<CandidateHistory candidateId={id} initialEvents={initial} initialCursor={cursor} />);
  fireEvent.click(screen.getByRole("button",{ name:"Ver más" }));
  await screen.findByRole("alert"); expect(screen.getAllByRole("listitem")).toHaveLength(5);
  await waitFor(()=>expect(screen.getByRole("button",{ name:"Ver más" })).toHaveProperty("disabled",false));
  fireEvent.click(screen.getByRole("button",{ name:"Ver más" }));
  await screen.findByText("Perfil vinculado");
  expect(screen.getAllByRole("listitem")).toHaveLength(6); expect(mocks.load.mock.calls[1]![0].cursor).toEqual(cursor);
});
it("presenta fallo de red sin descartar los eventos visibles",async()=>{
  mocks.load.mockRejectedValue(new Error("private failure"));
  render(<CandidateHistory candidateId={id} initialEvents={initial} initialCursor={cursor} />);
  fireEvent.click(screen.getByRole("button",{ name:"Ver más" }));
  await screen.findByRole("alert"); expect(screen.getAllByRole("listitem")).toHaveLength(5);
  expect(screen.getByRole("alert").textContent).not.toContain("private failure");
});
it("no permite dobles solicitudes mientras carga",async()=>{
  let finish!:(value:unknown)=>void;
  mocks.load.mockReturnValue(new Promise(resolve=>{finish=resolve;}));
  render(<CandidateHistory candidateId={id} initialEvents={initial} initialCursor={cursor} />);
  fireEvent.click(screen.getByRole("button",{ name:"Ver más" }));
  const button=await screen.findByRole("button",{ name:"Cargando…" });
  expect(button).toHaveProperty("disabled",true); fireEvent.click(button); expect(mocks.load).toHaveBeenCalledTimes(1);
  finish({ success:true,page:{ events:[],nextCursor:null } });
  await waitFor(()=>expect(screen.getByRole("status").textContent).toContain("No hay más eventos"));
});
it("distingue no tener eventos visibles de no tener registros internos",()=>{
  render(<CandidateHistory candidateId={id} initialEvents={[]} initialCursor={null} />);
  expect(screen.getByText("Sin eventos para mostrar")).toBeTruthy();
  expect(screen.queryByRole("button",{ name:"Ver más" })).toBeNull();
  expect(screen.queryByText("Todavía no hay movimientos registrados.")).toBeNull();
});
it("presenta horario argentino de24h sin ambigüedad de mañana/tarde",()=>{
  render(<CandidateHistory candidateId={id} initialEvents={[{ ...initial[0]!,occurred_at:"2031-01-01T00:00:00Z" }]} initialCursor={null} />);
  expect(screen.getByText("31/12/2030, 21:00:00")).toBeTruthy();
});
