# 🕸️ Link Mapper Pro

CLI avanzada para rastrear, mapear y filtrar enlaces desde una o múltiples URLs, con soporte para profundidad configurable, exclusiones personalizadas y exportación estructurada en JSON.

---

## 🚀 Características

* 🔗 Rastreo de enlaces internos y externos
* 📂 Entrada por argumentos o archivo (`--file`)
* 🔍 Control de profundidad (`--depth`)
* 🧹 Filtros de exclusión (`exclude.txt`)
* 📊 Salida estructurada en JSON
* ⚡ Procesamiento concurrente
* 🧠 Filtrado inteligente de URLs (slug largo o `.html`)
* ❌ Manejo de errores de rastreo

---

## 📦 Instalación

```bash
npm install
```

O si quieres usarlo como CLI global:

```bash
npm install -g .
```

---

## 🧪 Uso básico

```bash
node index.js https://ejemplo.com
```

---

## ⚙️ Opciones disponibles

| Opción               | Descripción            | Valor por defecto    |
| -------------------- | ---------------------- | -------------------- |
| `urls...`            | URLs iniciales         | -                    |
| `-f, --file`         | Archivo con URLs       | -                    |
| `-d, --depth`        | Profundidad de rastreo | `1`                  |
| `-o, --output`       | Archivo de salida      | `mapeo_enlaces.json` |
| `-X, --exclude-file` | Archivo de exclusiones | `exclude.txt`        |

---

## 📂 Ejemplo de archivo de URLs

**urls.txt**

```
https://ejemplo1.com
https://ejemplo2.com
```

Uso:

```bash
node index.js -f urls.txt
```

---

## 🧹 Ejemplo de archivo de exclusión

**exclude.txt**

```
login
admin
privado
# comentarios ignorados
```

---

## 📊 Estructura de salida

```json
{
  "meta": {
    "fecha": "2026-01-01T00:00:00.000Z",
    "config": {}
  },
  "resumen": {
    "total_capturado": 100,
    "total_final_filtrado": 80,
    "enlaces_eliminados": 20,
    "errores_rastreo": 2
  },
  "enlaces_internos": [],
  "enlaces_externos": [],
  "errores_detalle": []
}
```

---

# ✅ EJEMPLOS CORRECTOS

## 1. Uso básico

```bash
node index.js https://site.com
```

✔ Correcto: URL válida

---

## 2. Múltiples URLs

```bash
node index.js https://site1.com https://site2.com
```

✔ Correcto: múltiples semillas

---

## 3. Usando archivo

```bash
node index.js -f urls.txt
```

✔ Correcto: archivo existente

---

## 4. Profundidad personalizada

```bash
node index.js https://site.com -d 3
```

✔ Correcto: profundidad numérica válida

---

## 5. Salida personalizada

```bash
node index.js https://site.com -o resultado.json
```

✔ Correcto

---

## 6. Exclusión personalizada

```bash
node index.js https://site.com -X mi_exclude.txt
```

✔ Correcto

---

## 7. Combinación completa

```bash
node index.js https://site.com -f urls.txt -d 2 -o salida.json -X exclude.txt
```

✔ Correcto: uso combinado de todas las opciones

---

# ❌ EJEMPLOS INCORRECTOS

## 1. URL inválida

```bash
node index.js hola
```

❌ Error: no es una URL válida

---

## 2. Archivo inexistente

```bash
node index.js -f no_existe.txt
```

❌ Error: el archivo no existe

---

## 3. Profundidad inválida

```bash
node index.js https://site.com -d abc
```

❌ Error: `depth` debe ser número

---

## 4. Sin URLs ni archivo

```bash
node index.js
```

❌ Error: no se proporcionaron URLs

---

## 5. Archivo con contenido inválido

**urls.txt**

```
hola
ftp://mal
```

```bash
node index.js -f urls.txt
```

❌ Error: se ignoran líneas inválidas

---

## 6. Archivo exclude mal formado

```
   (líneas vacías o mal formadas)
```

✔ No rompe, pero no filtra correctamente

---

# 🔄 TODAS LAS COMBINACIONES POSIBLES

## Solo URLs

```bash
node index.js https://a.com
```

## Solo archivo

```bash
node index.js -f urls.txt
```

## URLs + archivo

```bash
node index.js https://a.com -f urls.txt
```

## URLs + profundidad

```bash
node index.js https://a.com -d 2
```

## URLs + salida

```bash
node index.js https://a.com -o out.json
```

## URLs + exclusión

```bash
node index.js https://a.com -X exclude.txt
```

## Archivo + profundidad

```bash
node index.js -f urls.txt -d 3
```

## Archivo + salida

```bash
node index.js -f urls.txt -o out.json
```

## Archivo + exclusión

```bash
node index.js -f urls.txt -X exclude.txt
```

## URLs + archivo + profundidad

```bash
node index.js https://a.com -f urls.txt -d 2
```

## URLs + archivo + salida

```bash
node index.js https://a.com -f urls.txt -o out.json
```

## URLs + archivo + exclusión

```bash
node index.js https://a.com -f urls.txt -X exclude.txt
```

## TODO combinado

```bash
node index.js https://a.com -f urls.txt -d 2 -o out.json -X exclude.txt
```

---

# ⚠️ Consideraciones técnicas

* Solo se procesan enlaces dentro de:

  * `<article>`
  * `<section>`
  * `<main>`
* Se ignoran:

  * `#anchors`
  * `javascript:`
* Solo se incluyen URLs que:

  * Terminan en `.html`
  * Tienen slug largo (>20 caracteres)
* Clasificación:

  * Internos → dominio específico
  * Externos → resto

---

# 🛠️ Dependencias

* commander
* axios
* cheerio
* chalk

---

# 📌 Notas

* El sistema usa concurrencia (`Promise.all`)
* Manejo de errores robusto
* Optimizado para scraping controlado (timeout incluido)

---

# 📄 Licencia

MIT

---

# 👨‍💻 Autor

Desarrollado para análisis y mapeo avanzado de enlaces web.
