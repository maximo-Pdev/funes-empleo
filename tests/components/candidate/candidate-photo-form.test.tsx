import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CandidatePhotoForm } from "@/features/candidates/components/candidate-photo-form";
const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const props = { candidateId: "candidate-ficticio", version: 3, name: "Persona Ficticia" };
beforeEach(() => { refresh.mockClear(); });
afterEach(() => { vi.unstubAllGlobals(); });
describe("foto privada del candidato", () => {
  it.each(["invalid", "conflict", "denied", "error"])("conserva la foto actual y muestra el rechazo %s sin anunciar guardado", async status => {
    const request = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ status, message: "No se pudo realizar el cambio." }) });
    vi.stubGlobal("fetch", request);
    const { container } = render(<CandidatePhotoForm {...props} photo={{ id: "foto-anterior" }} />);
    fireEvent.change(screen.getByLabelText("Elegir foto de perfil"), { target: { files: [new File(["imagen"], "foto.png", { type: "image/png" })] } });
    expect((await screen.findByRole("alert")).textContent).toBe("No se pudo realizar el cambio.");
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByRole("button", { name: "Cambiar foto" })).toHaveProperty("disabled", false);
    expect(container.querySelector('[data-slot="avatar"]')).not.toBeNull();
  });
  it("omite detalles internos ante fallo de red y permite volver a elegir", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private storage path")));
    render(<CandidatePhotoForm {...props} />);
    fireEvent.change(screen.getByLabelText("Elegir foto de perfil"), { target: { files: [new File(["imagen"], "foto.jpg", { type: "image/jpeg" })] } });
    expect((await screen.findByRole("alert")).textContent).toContain("Revisá la foto vigente");
    expect(screen.getByRole("alert").textContent).not.toContain("private storage path");
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Subir foto" })).toHaveProperty("disabled", false);
  });
  it("abre la selección desde el botón accesible y bloquea mutaciones duplicadas mientras espera", async () => {
    const request = vi.fn().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal("fetch", request);
    render(<CandidatePhotoForm {...props} photo={{ id: "foto-anterior" }} />);
    const input = screen.getByLabelText("Elegir foto de perfil") as HTMLInputElement;
    const click = vi.spyOn(input, "click");
    fireEvent.click(screen.getByRole("button", { name: "Cambiar foto" }));
    expect(click).toHaveBeenCalledOnce();
    fireEvent.change(input, { target: { files: [new File(["imagen"], "foto.png", { type: "image/png" })] } });
    fireEvent.click(screen.getByRole("button", { name: "Eliminar foto" }));
    expect(request).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Cambiar foto" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Eliminar foto" })).toHaveProperty("disabled", true);
    expect(refresh).not.toHaveBeenCalled();
  });
  it("elimina mediante servidor y permite reintentar limpieza pendiente aun sin foto actual", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "cleanup_pending", message: "Foto desvinculada. El borrado del archivo está pendiente." }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "ok", message: "Limpieza completada." }) });
    vi.stubGlobal("fetch", request);
    const { rerender } = render(<CandidatePhotoForm {...props} photo={{ id: "foto-ficticia" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar foto" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(request.mock.calls[0]![1].body.get("command")).toBe("remove");
    expect(request.mock.calls[0]![1].body.has("photo")).toBe(false);
    expect(screen.getByRole("status").textContent).toContain("borrado del archivo está pendiente");
    rerender(<CandidatePhotoForm {...props} version={4} photo={null} />);
    const retry = screen.getByRole("button", { name: "Reintentar eliminación" });
    expect(retry).toHaveProperty("disabled", false);
    fireEvent.click(retry);
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
    expect(request.mock.calls[1]![1].body.get("version")).toBe("4");
    expect(screen.getByRole("button", { name: "Subir foto" })).toHaveProperty("disabled", false);
  });
  it("envía el archivo con ID y versión al servidor y refresca solo tras confirmar", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "ok", message: "Foto guardada." }) });
    vi.stubGlobal("fetch", request);
    render(<CandidatePhotoForm {...props} />);
    const file = new File(["imagen ficticia"], "foto.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Elegir foto de perfil"), { target: { files: [file] } });
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    const [url, options] = request.mock.calls[0]!;
    expect(url).toBe("/api/candidate/photo");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ Accept: "application/json" });
    expect(options.body.get("candidateId")).toBe(props.candidateId);
    expect(options.body.get("version")).toBe("3");
    expect(options.body.get("command")).toBe("upload");
    expect(options.body.get("photo")).toBe(file);
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("status").textContent).toContain("Foto guardada.");
  });
});
