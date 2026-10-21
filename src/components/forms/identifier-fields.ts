export const dniField = {
  pattern: String.raw`(?:[0-9][ .\x2d]*){7,8}`,
  title: "Ingresá un DNI de 7 u 8 dígitos; podés separar con puntos, espacios o guiones.",
};

export const cuitField = {
  pattern: String.raw`(?:[0-9][ .\x2d]*){11}`,
  title: "Ingresá un CUIT de 11 dígitos; podés separar con puntos, espacios o guiones.",
};

export const candidatePhoneField = {
  pattern: String.raw`[+0-9\(\) \x2d]{6,50}`,
  title: "Ingresá un teléfono de 6 a 50 caracteres usando números, espacios, +, paréntesis o guiones.",
};

export const companyPhoneField = {
  pattern: String.raw`\+?(?:[\(\).\s\x2d]*[0-9]){1,21}[\(\).\s\x2d]*`,
  title: "Ingresá un teléfono de hasta 21 dígitos; podés usar + al principio, espacios, puntos, paréntesis o guiones.",
};
