const fs = require('fs');
const cheerio = require('cheerio');
const { program } = require('commander');

// Configuración de la CLI
program
  .name('link-mapper-pro')
  .description('Extrae contenido (H1-H4, P) de URLs con mínimo uso de RAM')
  .version('1.3.0')
  .argument('[urls...]', 'URLs pasadas directamente por consola')
  .option('-f, --file <path>', 'Archivo TXT (una URL por línea) o JSON (con campo enlaces_externos)')
  .option('-o, --output <filename>', 'Archivo de salida para el texto extraído', 'extraccion_contenido.txt')
  .action(async (cmdUrls, options) => {
    await ejecutarScraper(cmdUrls, options);
  });

program.parse();

async function ejecutarScraper(cmdUrls, options) {
    const listaFinalUrls = new Set(cmdUrls);

    // 1. Cargar URLs desde archivo si se proporciona
    if (options.file) {
        try {
            const contenidoSuelto = fs.readFileSync(options.file, 'utf8');
            
            if (options.file.endsWith('.json')) {
                // Lógica específica para tu archivo JSON
                const data = JSON.parse(contenidoSuelto);
                const externos = data.enlaces_externos || [];
                externos.forEach(u => listaFinalUrls.add(u));
            } else {
                // Lógica para archivo TXT
                contenidoSuelto.split(/\r?\n/).forEach(line => {
                    const url = line.trim();
                    if (url) listaFinalUrls.add(url);
                });
            }
        } catch (err) {
            console.error(`Error al leer el archivo: ${err.message}`);
            process.exit(1);
        }
    }

    if (listaFinalUrls.size === 0) {
        console.error('Error: No se proporcionaron URLs. Usa el argumento o la opción -f.');
        process.exit(1);
    }

    // 2. Preparar Stream de escritura (flags: 'a' para anexar o 'w' para sobrescribir)
    // Usamos 'w' para que cada vez que lances el programa el archivo sea nuevo, 
    // pero escribimos mediante stream para no saturar la RAM.
    const outputStream = fs.createWriteStream(options.output, { flags: 'w' });
    
    console.log(`Iniciando proceso para ${listaFinalUrls.size} enlaces...`);

    let i = 0;
    for (let url of listaFinalUrls) {
        i++;
        console.log(`[${i}/${listaFinalUrls.size}] Extrayendo: ${url}`);

        try {
            // Petición con timeout y cabecera de navegador
            const response = await fetch(url, { 
                signal: AbortSignal.timeout(15000),
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });

            if (!response.ok) throw new Error(`Status ${response.status}`);
            
            const html = await response.text();
            let $ = cheerio.load(html);

            outputStream.write(`\n========================================\n`);
            outputStream.write(`FUENTE: ${url}\n`);
            outputStream.write(`========================================\n\n`);

            // Extraer etiquetas clave
            $('h1, h2, h3, h4, p').each((_, el) => {
                const text = $(el).text().replace(/\s+/g, ' ').trim();
                if (text.length > 0) {
                    outputStream.write(`${text}\n\n`);
                }
            });

            // Liberar memoria de Cheerio explícitamente
            $ = null;

        } catch (error) {
            console.error(`   ⚠️ Error en enlace: ${error.message}`);
            outputStream.write(`\n--- ERROR EN FUENTE: ${url} (${error.message}) ---\n`);
        }

        // Pequeño respiro para el sistema antes del siguiente enlace
        await new Promise(r => setTimeout(r, 100));
    }

    outputStream.end();
    console.log(`\n✅ Finalizado. Contenido guardado en: ${options.output}`);
}