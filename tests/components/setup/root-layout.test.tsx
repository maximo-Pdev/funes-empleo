import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import RootLayout, { metadata } from "@/app/layout";

it("uses the supplied white emblem as the site favicon", () => {
  expect(metadata.icons).toEqual({
    icon: { url: "/brand/funes-favicon-white.png?v=white-emblem-1", type: "image/png", sizes: "256x256" },
  });
});

it("no agrega el enlace global oculto ni otro enlace antes del contenido", () => {
  const markup = renderToStaticMarkup(<RootLayout><main id="contenido"><h1>Perfil</h1></main></RootLayout>);
  const page = new DOMParser().parseFromString(markup, "text/html");
  expect(page.body.querySelector(":scope > a")).toBeNull();
  expect(page.body.textContent).not.toContain("Ir al contenido principal");
  expect(page.documentElement.lang).toBe("es-AR");
});

it("conserva el destino principal y los enlaces de navegación de sus páginas", () => {
  const markup = renderToStaticMarkup(<RootLayout>
    <nav aria-label="Navegación principal"><a href="#contenido">Inicio</a></nav>
    <main id="contenido" tabIndex={-1}><h1>Perfil</h1><button type="button">Editar perfil</button></main>
  </RootLayout>);
  const page = new DOMParser().parseFromString(markup, "text/html");
  expect(page.querySelectorAll("main#contenido")).toHaveLength(1);
  expect(page.querySelector("main")?.getAttribute("tabindex")).toBe("-1");
  expect(page.querySelectorAll('a[href="#contenido"]')).toHaveLength(1);
  expect(page.querySelector("nav a")?.textContent).toBe("Inicio");
  expect(page.querySelector("main button")?.textContent).toBe("Editar perfil");
});
